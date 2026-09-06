import zlib
import struct
import math
import os

def create_png(width, height, pixel_data_rgba):
    """
    pixel_data_rgba is a list or bytes of length width * height * 4
    """
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # Filter type 0 (None)
        start = y * width * 4
        end = start + width * 4
        raw_data.extend(pixel_data_rgba[start:end])

    def chunk(tag, data):
        c = bytearray(tag.encode('ascii')) + data
        crc = zlib.crc32(c)
        return struct.pack('>I', len(data)) + c + struct.pack('>I', crc)

    header = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    idat = zlib.compress(bytes(raw_data), 9)

    return header + chunk('IHDR', ihdr) + chunk('IDAT', idat) + chunk('IEND', b'')

def render_product_hub_icon(size):
    pixels = bytearray(size * size * 4)
    cx, cy = (size - 1) / 2.0, (size - 1) / 2.0
    corner_radius = size * 0.26

    # Gradient colors
    c_blue_light = (59, 130, 246)  # #3b82f6
    c_blue_dark  = (29, 78, 216)   # #1d4ed8
    c_top_face   = (240, 246, 255) # #f0f6ff
    c_left_face  = (147, 197, 253) # #93c5fd
    c_right_face = (96, 165, 250)  # #60a5fa
    c_line       = (37, 99, 235)   # #2563eb

    def point_in_polygon(px, py, poly):
        n = len(poly)
        inside = False
        p1x, p1y = poly[0]
        for i in range(n + 1):
            p2x, p2y = poly[i % n]
            if py > min(p1y, p2y):
                if py <= max(p1y, p2y):
                    if px <= max(p1x, p2x):
                        if p1y != p2y:
                            xinters = (py - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                        if p1x == p2x or px <= xinters:
                            inside = not inside
            p1x, p1y = p2x, p2y
        return inside

    # Coordinates for cube scaled to size
    s = size / 64.0
    poly_top = [(32*s, 15*s), (48*s, 23*s), (32*s, 31*s), (16*s, 23*s)]
    poly_left = [(16*s, 23*s), (32*s, 31*s), (32*s, 49*s), (16*s, 41*s)]
    poly_right = [(32*s, 31*s), (48*s, 23*s), (48*s, 41*s), (32*s, 49*s)]

    for y in range(size):
        for x in range(size):
            idx = (y * size + x) * 4

            # Rounded box SDF
            dx = abs(x - cx) - (cx - corner_radius)
            dy = abs(y - cy) - (cy - corner_radius)
            outside_dist = 0.0
            if dx > 0 and dy > 0:
                outside_dist = math.sqrt(dx*dx + dy*dy) - corner_radius
            elif dx > 0:
                outside_dist = dx - corner_radius
            elif dy > 0:
                outside_dist = dy - corner_radius
            else:
                outside_dist = max(dx, dy) - corner_radius

            # Antialiasing alpha
            if outside_dist > 0.5:
                # Fully outside
                pixels[idx] = 0
                pixels[idx+1] = 0
                pixels[idx+2] = 0
                pixels[idx+3] = 0
                continue
            
            alpha = 1.0
            if outside_dist > -0.5:
                alpha = 0.5 - outside_dist

            # Background gradient
            t = (x + y) / (2.0 * size)
            r = int(c_blue_light[0] * (1 - t) + c_blue_dark[0] * t)
            g = int(c_blue_light[1] * (1 - t) + c_blue_dark[1] * t)
            b = int(c_blue_light[2] * (1 - t) + c_blue_dark[2] * t)

            # Check inside cube facets
            px, py = float(x), float(y)
            if point_in_polygon(px, py, poly_top):
                # Gradient on top face
                tf = (y - 15*s) / (16*s + 1e-5)
                r = int(255 * (1 - tf) + c_top_face[0] * tf)
                g = int(255 * (1 - tf) + c_top_face[1] * tf)
                b = int(255 * (1 - tf) + c_top_face[2] * tf)
            elif point_in_polygon(px, py, poly_left):
                r, g, b = c_left_face
            elif point_in_polygon(px, py, poly_right):
                r, g, b = c_right_face

            # Center seam
            if abs(x - 32*s) < max(0.6*s, 0.8) and (31*s <= y <= 49*s):
                r, g, b = c_line

            pixels[idx] = r
            pixels[idx+1] = g
            pixels[idx+2] = b
            pixels[idx+3] = int(alpha * 255)

    return pixels

def create_ico(png_bytes_list):
    """
    Creates an ICO file embedding PNG byte streams.
    """
    count = len(png_bytes_list)
    header = struct.pack('<HHH', 0, 1, count)
    
    offset = 6 + count * 16
    entries = bytearray()
    images = bytearray()

    for width, height, data in png_bytes_list:
        w_byte = width if width < 256 else 0
        h_byte = height if height < 256 else 0
        entry = struct.pack('<BBBBHHII', w_byte, h_byte, 0, 0, 1, 32, len(data), offset)
        entries.extend(entry)
        images.extend(data)
        offset += len(data)

    return header + entries + images

def main():
    public_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'product-sync-hub', 'public')
    if not os.path.exists(public_dir):
        public_dir = os.path.join(os.getcwd(), 'public')

    print(f"Targeting public directory: {public_dir}")

    # Generate 64x64 PNG
    p64 = render_product_hub_icon(64)
    png64 = create_png(64, 64, p64)
    with open(os.path.join(public_dir, 'favicon.png'), 'wb') as f:
        f.write(png64)
    print("Created favicon.png (64x64)")

    # Generate 192x192 PNG for apple-touch-icon
    p192 = render_product_hub_icon(192)
    png192 = create_png(192, 192, p192)
    with open(os.path.join(public_dir, 'apple-touch-icon.png'), 'wb') as f:
        f.write(png192)
    print("Created apple-touch-icon.png (192x192)")

    # Generate 32x32 PNG for ICO
    p32 = render_product_hub_icon(32)
    png32 = create_png(32, 32, p32)

    # Pack into favicon.ico
    ico_data = create_ico([(32, 32, png32), (64, 64, png64)])
    with open(os.path.join(public_dir, 'favicon.ico'), 'wb') as f:
        f.write(ico_data)
    print("Created favicon.ico (32x32 & 64x64 multi-res)")

if __name__ == '__main__':
    main()
