#!/usr/bin/env python3
"""
Repack, release-patch, 4-byte zipalign, and V1+V2+V3 sign public/vaultbound.apk
using fresh web assets from android/app/src/main/assets/.
"""

import os
import shutil
import struct
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APK_PATH = ROOT / "public" / "vaultbound.apk"
ASSETS_DIR = ROOT / "android" / "app" / "src" / "main" / "assets"
KEY_PK8 = ROOT / "android" / "release-key.pk8"
CERT_PEM = ROOT / "android" / "release-cert.pem"

TARGET_VERSION_CODE = 3
TARGET_VERSION_NAME = "1.0.3"


def ensure_release_credentials():
    if KEY_PK8.exists() and CERT_PEM.exists():
        return

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        key_pem = tmp_path / "key.pem"
        csr_pem = tmp_path / "req.csr"
        index_txt = tmp_path / "index.txt"
        serial_txt = tmp_path / "serial"
        newcerts = tmp_path / "newcerts"
        newcerts.mkdir()
        index_txt.write_text("")
        serial_txt.write_text("1000\n")

        openssl_cnf = tmp_path / "openssl.cnf"
        openssl_cnf.write_text(
            f"""
[ ca ]
default_ca = CA_default

[ CA_default ]
dir = {tmp_path}
database = {index_txt}
new_certs_dir = {newcerts}
serial = {serial_txt}
default_md = sha256
policy = policy_anything
x509_extensions = v3_ext
unique_subject = no

[ policy_anything ]
countryName = optional
organizationName = optional
commonName = supplied

[ req ]
distinguished_name = req_dn
prompt = no

[ req_dn ]
CN = Vaultbound
O = Vaultbound Games
C = US

[ v3_ext ]
basicConstraints = critical, CA:FALSE
keyUsage = critical, digitalSignature
subjectKeyIdentifier = hash
"""
        )

        # Generate RSA-2048 private key
        subprocess.run(
            ["openssl", "genrsa", "-out", str(key_pem), "2048"],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
        )
        # Convert private key to PKCS#8 DER for apksigner
        subprocess.run(
            [
                "openssl",
                "pkcs8",
                "-topk8",
                "-inform",
                "PEM",
                "-outform",
                "DER",
                "-in",
                str(key_pem),
                "-out",
                str(KEY_PK8),
                "-nocrypt",
            ],
            check=True,
        )
        # Create CSR
        subprocess.run(
            [
                "openssl",
                "req",
                "-new",
                "-key",
                str(key_pem),
                "-out",
                str(csr_pem),
                "-config",
                str(openssl_cnf),
            ],
            check=True,
        )
        # Self-sign certificate with backdated notBefore (2024-01-01) and 30-year validity
        subprocess.run(
            [
                "openssl",
                "ca",
                "-batch",
                "-selfsign",
                "-config",
                str(openssl_cnf),
                "-keyfile",
                str(key_pem),
                "-in",
                str(csr_pem),
                "-out",
                str(CERT_PEM),
                "-startdate",
                "20240101000000Z",
                "-enddate",
                "20540101000000Z",
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
        )


def patch_android_manifest(raw: bytes) -> bytes:
    """
    Safely patch binary AXML AndroidManifest.xml in-place (zero offset shifts):
      1. android:debuggable -> false (0x00000000)
      2. android:versionCode -> TARGET_VERSION_CODE
      3. android:versionName -> TARGET_VERSION_NAME (must be same length as original)
    """
    buf = bytearray(raw)
    pos = 8
    strings = []
    string_pool_info = None

    while pos < len(buf):
        ctype, hsize, csize = struct.unpack_from("<HHI", buf, pos)
        if ctype == 0x0001:  # STRING_POOL
            scount, style_count, flags, str_start, style_start = struct.unpack_from(
                "<IIIII", buf, pos + 8
            )
            is_utf8 = bool(flags & (1 << 8))
            offsets = struct.unpack_from(f"<{scount}I", buf, pos + 28)
            base = pos + str_start
            string_pool_info = (is_utf8, base, offsets)
            for idx, off in enumerate(offsets):
                p = base + off
                if is_utf8:
                    u16len = buf[p]
                    p += 1
                    if u16len & 0x80:
                        p += 1
                    u8len = buf[p]
                    p += 1
                    if u8len & 0x80:
                        u8len = ((u8len & 0x7F) << 8) | buf[p]
                        p += 1
                    s = buf[p : p + u8len].decode("utf-8", errors="replace")
                    strings.append((s, p, u8len, True))
                else:
                    u16len = struct.unpack_from("<H", buf, p)[0]
                    p += 2
                    if u16len & 0x8000:
                        low = struct.unpack_from("<H", buf, p)[0]
                        p += 2
                        u16len = ((u16len & 0x7FFF) << 16) | low
                    s = buf[p : p + u16len * 2].decode("utf-16le", errors="replace")
                    strings.append((s, p, u16len * 2, False))
        elif ctype == 0x0102:  # START_ELEMENT
            ns, name, attr_start, attr_size, attr_count = struct.unpack_from(
                "<IIHHH", buf, pos + 16
            )
            ename = strings[name][0] if name < len(strings) else ""
            ap = pos + 16 + attr_start
            for _ in range(attr_count):
                ans, aname, araw, asize, _, atype, adata = struct.unpack_from(
                    "<IIIHBBI", buf, ap
                )
                an = strings[aname][0] if aname < len(strings) else ""
                # Patch application android:debuggable = false
                if ename == "application" and an == "debuggable" and atype == 0x12:
                    struct.pack_into("<I", buf, ap + 16, 0)
                # Patch manifest android:versionCode
                elif ename == "manifest" and an == "versionCode" and atype == 0x10:
                    struct.pack_into("<I", buf, ap + 16, TARGET_VERSION_CODE)
                # Patch manifest android:versionName (same char length in-place)
                elif ename == "manifest" and an == "versionName" and atype == 0x03:
                    if adata < len(strings):
                        old_s, sp, slen, is_u8 = strings[adata]
                        new_enc = (
                            TARGET_VERSION_NAME.encode("utf-8")
                            if is_u8
                            else TARGET_VERSION_NAME.encode("utf-16le")
                        )
                        if len(new_enc) == slen:
                            buf[sp : sp + slen] = new_enc
                ap += attr_size
        pos += csize

    return bytes(buf)


def build_apk():
    if not APK_PATH.exists():
        print(f"ERROR: Base APK not found at {APK_PATH}", file=sys.stderr)
        sys.exit(1)
    if not (ASSETS_DIR / "index.html").exists():
        print(f"ERROR: Built web assets not found in {ASSETS_DIR}", file=sys.stderr)
        sys.exit(1)

    ensure_release_credentials()

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        unsigned_apk = tmp_path / "unsigned.apk"
        aligned_apk = tmp_path / "aligned.apk"
        signed_apk = tmp_path / "signed.apk"

        with zipfile.ZipFile(APK_PATH, "r") as zin, zipfile.ZipFile(
            unsigned_apk, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6
        ) as zout:
            # 1. Copy base Android APK entries (skip old web assets & old V1 signatures)
            for item in zin.infolist():
                fn = item.filename
                if fn.startswith("assets/"):
                    continue
                if fn.startswith("META-INF/") and (
                    fn == "META-INF/MANIFEST.MF"
                    or fn.endswith((".SF", ".RSA", ".DSA", ".EC"))
                ):
                    continue

                payload = zin.read(fn)
                if fn == "AndroidManifest.xml":
                    payload = patch_android_manifest(payload)

                zi = zipfile.ZipInfo(fn)
                zi.date_time = (2025, 1, 1, 0, 0, 0)
                zi.compress_type = (
                    zipfile.ZIP_STORED
                    if (fn == "resources.arsc" or item.compress_type == zipfile.ZIP_STORED)
                    else zipfile.ZIP_DEFLATED
                )
                zout.writestr(zi, payload)

            # 2. Embed fresh web assets (skip sw.js/workbox & any aistudio screenshots)
            for file_path in sorted(ASSETS_DIR.rglob("*")):
                if not file_path.is_file():
                    continue
                rel = file_path.relative_to(ASSETS_DIR).as_posix()
                if rel.startswith("assets/aistudio/") or rel in ("sw.js", "vaultbound.apk"):
                    continue
                if rel.startswith("workbox-") and rel.endswith(".js"):
                    continue
                arcname = f"assets/{rel}"
                zi = zipfile.ZipInfo(arcname)
                zi.date_time = (2025, 1, 1, 0, 0, 0)
                # Keep already-compressed media stored to speed up loading & keep clean alignment
                if file_path.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp", ".woff2"):
                    zi.compress_type = zipfile.ZIP_STORED
                else:
                    zi.compress_type = zipfile.ZIP_DEFLATED
                zout.writestr(zi, file_path.read_bytes())

        # 3. Official 4-byte zipalign (required by Android 11-16 for resources.arsc & stored files)
        subprocess.run(
            ["zipalign", "-f", "-p", "4", str(unsigned_apk), str(aligned_apk)],
            check=True,
        )

        # 4. Official Google apksigner with V1 + V2 + V3 signatures (Android 8 -> Android 16 / Pixel 9a)
        subprocess.run(
            [
                "apksigner",
                "sign",
                "--key",
                str(KEY_PK8),
                "--cert",
                str(CERT_PEM),
                "--v1-signing-enabled",
                "true",
                "--v2-signing-enabled",
                "true",
                "--v3-signing-enabled",
                "true",
                "--v4-signing-enabled",
                "false",
                "--out",
                str(signed_apk),
                str(aligned_apk),
            ],
            check=True,
        )

        # 5. Verify both alignment & signatures before replacing public/vaultbound.apk
        subprocess.run(["zipalign", "-c", "4", str(signed_apk)], check=True)
        verify = subprocess.run(
            ["apksigner", "verify", "--verbose", "--print-certs", str(signed_apk)],
            check=True,
            capture_output=True,
            text=True,
        )
        shutil.copy2(signed_apk, APK_PATH)
        print(verify.stdout.strip())
        print(f"SUCCESS: Updated {APK_PATH} ({APK_PATH.stat().st_size} bytes)")


if __name__ == "__main__":
    build_apk()
