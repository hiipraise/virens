"""
Virens Invisible Watermarking Service
Native LSB (Least Significant Bit) steganography — no external stegano library.
Works with any Pillow version >= 9.x.

Embeds creator_id + username invisibly inside image pixels.
The metadata survives in the original downloaded file even if the UI prevents
right-click saving, providing a copyright proof trail for DMCA purposes.
"""
import io
import json
import asyncio
from typing import Optional
import structlog

logger = structlog.get_logger()

# Bit pattern that marks the end of the embedded payload
_END_MARKER = "1111111111111110"


async def embed_invisible_watermark(
    image_bytes: bytes,
    creator_id: str,
    creator_username: str,
) -> bytes:
    """
    Embed invisible creator metadata into image pixels using LSB steganography.
    Runs in a thread executor so it doesn't block the async event loop.
    Returns modified PNG bytes. Falls back to original bytes on any error.
    """
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None, _embed_sync, image_bytes, creator_id, creator_username
        )
        return result
    except Exception as e:
        logger.warning("Watermark embedding failed, returning original", error=str(e))
        return image_bytes


def _embed_sync(image_bytes: bytes, creator_id: str, creator_username: str) -> bytes:
    """Synchronous LSB embed using Pillow + NumPy only."""
    from PIL import Image
    import numpy as np

    payload = json.dumps({
        "vid": creator_id,
        "vun": creator_username,
        "platform": "virens",
    }, separators=(",", ":"))

    payload_bits = "".join(f"{byte:08b}" for byte in payload.encode("utf-8"))
    payload_bits += _END_MARKER

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    arr = np.array(img, dtype=np.uint8)
    flat = arr.flatten()

    if len(payload_bits) > len(flat):
        logger.warning(
            "Image too small to embed watermark, skipping",
            bits_needed=len(payload_bits),
            pixels_available=len(flat),
        )
        return image_bytes

    # Write each bit into the LSB of each pixel channel value
    for i, bit in enumerate(payload_bits):
        flat[i] = (flat[i] & 0xFE) | int(bit)

    result_img = Image.fromarray(flat.reshape(arr.shape).astype(np.uint8))
    buf = io.BytesIO()
    result_img.save(buf, format="PNG")
    logger.info("Invisible watermark embedded", creator_id=creator_id)
    return buf.getvalue()


async def extract_watermark(image_bytes: bytes) -> Optional[dict]:
    """
    Extract and decode the LSB-embedded watermark from an image.
    Used during copyright investigations and DMCA enforcement.
    Returns the creator metadata dict, or None if no watermark found.
    """
    try:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _extract_sync, image_bytes)
    except Exception as e:
        logger.warning("Watermark extraction failed", error=str(e))
        return None


def _extract_sync(image_bytes: bytes) -> Optional[dict]:
    from PIL import Image
    import numpy as np

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    arr = np.array(img, dtype=np.uint8)
    flat = arr.flatten()

    # Read bits from LSB of each channel
    bits = [str(flat[i] & 1) for i in range(min(len(flat), 100_000))]
    bit_string = "".join(bits)

    # Find end marker
    end_idx = bit_string.find(_END_MARKER)
    if end_idx == -1:
        return None  # No watermark present

    payload_bits = bit_string[:end_idx]
    if len(payload_bits) % 8 != 0:
        return None

    # Decode bytes
    byte_values = [
        int(payload_bits[i : i + 8], 2)
        for i in range(0, len(payload_bits), 8)
    ]

    try:
        payload_str = bytes(byte_values).decode("utf-8")
        return json.loads(payload_str)
    except (UnicodeDecodeError, json.JSONDecodeError):
        return None
