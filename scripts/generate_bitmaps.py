import zlib
import struct
import math
import random

def save_png(w, h, buffer, filepath):
    raw = bytearray()
    row_bytes = w * 3
    for y in range(h):
        raw.append(0)
        start = y * row_bytes
        raw.extend(buffer[start:start + row_bytes])
    
    compressed = zlib.compress(bytes(raw), level=6)
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)
    
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff)
    
    png_data = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", compressed) + chunk(b"IEND", b"")
    with open(filepath, "wb") as f:
        f.write(png_data)

class Canvas:
    def __init__(self, w, h):
        self.w = w
        self.h = h
        self.buf = bytearray(w * h * 3)

    def set_pixel(self, x, y, r, g, b, a=1.0):
        if 0 <= x < self.w and 0 <= y < self.h:
            idx = (y * self.w + x) * 3
            if a >= 1.0:
                self.buf[idx] = max(0, min(255, int(r)))
                self.buf[idx + 1] = max(0, min(255, int(g)))
                self.buf[idx + 2] = max(0, min(255, int(b)))
            else:
                br = self.buf[idx]
                bg = self.buf[idx + 1]
                bb = self.buf[idx + 2]
                self.buf[idx] = max(0, min(255, int(br * (1 - a) + r * a)))
                self.buf[idx + 1] = max(0, min(255, int(bg * (1 - a) + g * a)))
                self.buf[idx + 2] = max(0, min(255, int(bb * (1 - a) + b * a)))

    def fill_vertical_gradient(self, col_top, col_bot):
        r1, g1, b1 = col_top
        r2, g2, b2 = col_bot
        for y in range(self.h):
            t = y / max(1, self.h - 1)
            # Smooth cubic curve
            t_smooth = t * t * (3 - 2 * t)
            r = int(r1 + (r2 - r1) * t_smooth)
            g = int(g1 + (g2 - g1) * t_smooth)
            b = int(b1 + (b2 - b1) * t_smooth)
            idx = y * self.w * 3
            for x in range(self.w):
                self.buf[idx] = r
                self.buf[idx + 1] = g
                self.buf[idx + 2] = b
                idx += 3

    def add_stars(self, count, seed=42):
        rng = random.Random(seed)
        for _ in range(count):
            x = rng.randint(0, self.w - 1)
            y = rng.randint(0, int(self.h * 0.78))
            bri = rng.uniform(0.3, 1.0)
            c = int(255 * bri)
            self.set_pixel(x, y, c, c, min(255, c + 25), bri)
            if rng.random() < 0.2:
                self.set_pixel(x - 1, y, c // 2, c // 2, c // 2, bri * 0.5)
                self.set_pixel(x + 1, y, c // 2, c // 2, c // 2, bri * 0.5)
                self.set_pixel(x, y - 1, c // 2, c // 2, c // 2, bri * 0.5)
                self.set_pixel(x, y + 1, c // 2, c // 2, c // 2, bri * 0.5)

    def draw_radial_glow(self, cx, cy, radius, r, g, b, max_alpha=1.0):
        min_x = max(0, int(cx - radius))
        max_x = min(self.w - 1, int(cx + radius))
        min_y = max(0, int(cy - radius))
        max_y = min(self.h - 1, int(cy + radius))
        r2 = radius * radius
        for y in range(min_y, max_y + 1):
            dy = y - cy
            for x in range(min_x, max_x + 1):
                dx = x - cx
                dist2 = dx * dx + dy * dy
                if dist2 < r2:
                    dist = math.sqrt(dist2)
                    falloff = 1.0 - (dist / radius)
                    alpha = falloff * falloff * max_alpha
                    self.set_pixel(x, y, r, g, b, alpha)

    def draw_mountain_silhouette(self, base_y, peak_height, freq=0.012, color=(14, 18, 28), seed=1):
        rng = random.Random(seed)
        phases = [rng.uniform(0, 100) for _ in range(3)]
        for x in range(self.w):
            h_offset = (
                math.sin(x * freq + phases[0]) * 0.5 +
                math.sin(x * freq * 2.3 + phases[1]) * 0.3 +
                math.sin(x * freq * 5.1 + phases[2]) * 0.2
            ) * peak_height
            y_start = int(base_y - h_offset)
            for y in range(max(0, y_start), self.h):
                self.set_pixel(x, y, color[0], color[1], color[2], 1.0)

    def apply_vignette(self):
        cx, cy = self.w / 2.0, self.h / 2.0
        max_dist = math.sqrt(cx * cx + cy * cy)
        for y in range(self.h):
            dy = y - cy
            for x in range(self.w):
                dx = x - cx
                dist = math.sqrt(dx * dx + dy * dy) / max_dist
                vig = 1.0 - (dist * 0.4)
                idx = (y * self.w + x) * 3
                self.buf[idx] = int(self.buf[idx] * vig)
                self.buf[idx + 1] = int(self.buf[idx + 1] * vig)
                self.buf[idx + 2] = int(self.buf[idx + 2] * vig)

# -------------------------------------------------------------
# 1. Main Menu Cinematic Hero Aerospace Banner (800 x 480)
# -------------------------------------------------------------
def generate_hero_banner():
    w, h = 800, 480
    cv = Canvas(w, h)
    cv.fill_vertical_gradient((6, 10, 24), (54, 28, 16))
    cv.add_stars(260, seed=108)

    # Cosmic glowing nebulas
    cv.draw_radial_glow(220, 100, 240, 56, 35, 110, 0.4)
    cv.draw_radial_glow(580, 140, 200, 110, 50, 40, 0.3)

    # Mountain ridges
    cv.draw_mountain_silhouette(h * 0.82, 65, freq=0.007, color=(28, 22, 30), seed=5)
    cv.draw_mountain_silhouette(h * 0.88, 40, freq=0.014, color=(16, 14, 20), seed=11)

    for y in range(int(h * 0.88), h):
        for x in range(w):
            cv.set_pixel(x, y, 14, 12, 16, 1.0)

    # Searchlight beams
    for y in range(int(h * 0.12), int(h * 0.88)):
        t = (y - h * 0.12) / (h * 0.76)
        bx1 = 340 + (1.0 - t) * 120
        hw1 = 10 + (1.0 - t) * 60
        for x in range(int(bx1 - hw1), int(bx1 + hw1)):
            cv.set_pixel(x, y, 220, 200, 140, 0.07 * (1.0 - abs(x - bx1) / hw1))

    # Gantry Tower
    gx, gy = 260, int(h * 0.88)
    for y in range(gy - 150, gy):
        for x in range(gx - 16, gx + 17):
            if (x - gx) % 8 == 0 or (y - gy) % 12 == 0 or abs(x - gx) == 16:
                cv.set_pixel(x, y, 12, 10, 14, 0.95)
    cv.set_pixel(gx - 16, gy - 150, 255, 60, 60, 1.0)
    cv.set_pixel(gx + 16, gy - 150, 255, 60, 60, 1.0)
    cv.set_pixel(gx, gy - 75, 255, 60, 60, 1.0)

    # Rocket Launch Trajectory
    # Launch origin at (gx + 30, gy - 40), target at upper right (620, 110)
    lx0, ly0 = gx + 30, gy - 40
    lx1, ly1 = 620, 110
    steps = 450

    # Exhaust Plume Trail
    for s in range(steps):
        t = s / steps
        rx = lx0 + (lx1 - lx0) * t
        ry = ly0 + (ly1 - ly0) * t
        # Flare size expands towards the base
        plume_r = 5 + (1.0 - t) * 20
        alpha = 0.35 * (0.3 + 0.7 * t)
        cv.draw_radial_glow(rx, ry, plume_r, 255, 140, 30, alpha)
        if t > 0.6:
            cv.draw_radial_glow(rx, ry, plume_r * 0.5, 255, 220, 120, alpha * 1.4)

    # Rocket Head & Body
    tip_x, tip_y = lx1, ly1
    angle = math.atan2(ly1 - ly0, lx1 - lx0)
    cos_a, sin_a = math.cos(angle), math.sin(angle)

    # Blinding Engine Core
    tail_x = tip_x - cos_a * 45
    tail_y = tip_y - sin_a * 45
    cv.draw_radial_glow(tail_x, tail_y, 28, 255, 240, 180, 0.95)
    cv.draw_radial_glow(tail_x - cos_a * 15, tail_y - sin_a * 15, 48, 255, 140, 30, 0.8)

    # Rocket Fuselage
    for l in range(0, 48):
        pos_x = tail_x + cos_a * l
        pos_y = tail_y + sin_a * l
        hw = 6 if l < 34 else max(0, int(6 * (48 - l) / 14))
        for w_side in range(-hw, hw + 1):
            px = int(pos_x - sin_a * w_side)
            py = int(pos_y + cos_a * w_side)
            # Metallic fuselage shading
            val = 240 if w_side < 0 else 190
            # Red tip stripe
            if l >= 38:
                cv.set_pixel(px, py, 210, 45, 45, 1.0)
            else:
                cv.set_pixel(px, py, val, val, val - 8, 1.0)

    # Rocket Tail Fins
    for fin in range(-12, 13):
        if abs(fin) > 5:
            px = int(tail_x - sin_a * fin)
            py = int(tail_y + cos_a * fin)
            cv.set_pixel(px, py, 180, 30, 30, 1.0)

    # Launchpad Ground Illumination
    cv.draw_radial_glow(gx + 20, gy, 190, 255, 150, 40, 0.45)

    cv.apply_vignette()
    save_png(w, h, cv.buf, "public/assets/images/hero_aerospace.png")
    print("Hero banner updated.")

# -------------------------------------------------------------
# 2. 16 Historical Milestone Thematic Bitmaps (400 x 240 each)
# -------------------------------------------------------------
def generate_milestones():
    milestones_meta = [
        {"theme": "df1", "sky": ((8, 12, 26), (46, 26, 18)), "name": "东风一号"},
        {"theme": "setback", "sky": ((12, 16, 30), (30, 36, 46)), "name": "坚韧受挫"},
        {"theme": "df2", "sky": ((10, 14, 34), (58, 32, 16)), "name": "东风二号"},
        {"theme": "uranium", "sky": ((12, 16, 28), (48, 42, 14)), "name": "铀浓缩突破"},
        {"theme": "atomic", "sky": ((18, 10, 12), (72, 32, 16)), "name": "第一颗原子弹"},
        {"theme": "airdrop", "sky": ((22, 16, 34), (88, 42, 22)), "name": "空投核航弹"},
        {"theme": "combo", "sky": ((10, 14, 28), (52, 26, 18)), "name": "两弹结合试验"},
        {"theme": "hydro", "sky": ((24, 16, 16), (115, 62, 22)), "name": "第一颗氢弹"},
        {"theme": "underground", "sky": ((10, 12, 20), (36, 30, 26)), "name": "首次地下核试验"},
        {"theme": "dfh1", "sky": ((3, 6, 18), (10, 20, 48)), "name": "东方红一号"},
        {"theme": "sj1", "sky": ((4, 8, 22), (14, 28, 62)), "name": "实践一号科学卫星"},
        {"theme": "df5", "sky": ((6, 10, 26), (18, 32, 72)), "name": "东风五号洲际导弹"},
        {"theme": "fsw", "sky": ((14, 8, 20), (68, 28, 16)), "name": "返回式遥感卫星"},
        {"theme": "task580", "sky": ((6, 18, 42), (18, 52, 88)), "name": "580任务南太平洋"},
        {"theme": "trio", "sky": ((4, 6, 20), (16, 24, 58)), "name": "一箭三星空间试验"},
        {"theme": "jl1", "sky": ((6, 14, 28), (10, 36, 62)), "name": "巨浪一号潜射导弹"},
    ]

    w, h = 400, 240
    for idx, m in enumerate(milestones_meta):
        cv = Canvas(w, h)
        cv.fill_vertical_gradient(m["sky"][0], m["sky"][1])
        cv.add_stars(90, seed=idx * 23 + 5)
        theme = m["theme"]

        if theme in ["df1", "df2"]:
            cv.draw_mountain_silhouette(h * 0.84, 28, freq=0.018, color=(22, 18, 26), seed=idx)
            for y in range(int(h * 0.88), h):
                for x in range(w):
                    cv.set_pixel(x, y, 18, 15, 20, 1.0)
            cv.draw_radial_glow(120, int(h * 0.86), 85, 255, 170, 50, 0.65)
            # Launch gantry silhouette
            for y in range(int(h * 0.58), int(h * 0.88)):
                for x in range(112, 128):
                    if (x - 112) % 6 == 0 or (y - int(h * 0.58)) % 8 == 0 or x in (112, 127):
                        cv.set_pixel(x, y, 14, 12, 16, 1.0)
            # Rocket ascending
            rx, ry = 230, int(h * 0.42)
            cv.draw_radial_glow(rx - 18, ry + 18, 38, 255, 150, 40, 0.85)
            cv.draw_radial_glow(rx - 35, ry + 35, 60, 240, 90, 20, 0.45)
            for l in range(-16, 18):
                cv.set_pixel(rx + l, ry - l, 245, 245, 245, 1.0)
                cv.set_pixel(rx + l + 1, ry - l, 220, 220, 210, 1.0)

        elif theme == "setback":
            cv.draw_mountain_silhouette(h * 0.82, 35, freq=0.016, color=(20, 24, 34), seed=14)
            # Radar tracking dish
            dx, dy = 170, int(h * 0.78)
            cv.draw_radial_glow(dx, dy - 20, 45, 220, 170, 90, 0.35)
            for angle_deg in range(120, 240, 4):
                rad = math.radians(angle_deg)
                cv.set_pixel(int(dx + math.cos(rad) * 22), int(dy - 20 + math.sin(rad) * 22), 220, 220, 230, 0.9)
            # Telemetry beacon
            cv.draw_radial_glow(dx, dy - 42, 18, 255, 75, 75, 0.95)

        elif theme == "uranium":
            cv.draw_radial_glow(200, 115, 105, 245, 195, 65, 0.75)
            cv.draw_radial_glow(200, 115, 45, 255, 245, 190, 0.95)
            for y in range(int(h * 0.76), h):
                for x in range(w):
                    cv.set_pixel(x, y, 16, 16, 20, 1.0)
            for angle_deg in range(0, 360, 2):
                rad = math.radians(angle_deg)
                cv.set_pixel(int(200 + math.cos(rad) * 70), int(115 + math.sin(rad) * 28), 255, 225, 130, 0.7)
                cv.set_pixel(int(200 + math.cos(rad) * 28), int(115 + math.sin(rad) * 70), 255, 225, 130, 0.7)

        elif theme == "atomic":
            # Lop Nur iconic mushroom cloud
            cx, cy = 200, 90
            # Expanding fireball top
            cv.draw_radial_glow(cx, cy, 70, 255, 210, 110, 0.95)
            cv.draw_radial_glow(cx - 30, cy + 10, 45, 255, 160, 50, 0.8)
            cv.draw_radial_glow(cx + 30, cy + 10, 45, 255, 160, 50, 0.8)
            cv.draw_radial_glow(cx, cy + 50, 38, 255, 140, 40, 0.85) # Column
            for y in range(int(h * 0.82), h):
                for x in range(w):
                    cv.set_pixel(x, y, 30, 20, 16, 1.0)
            for x in range(w):
                if 95 < abs(x - cx) < 115:
                    cv.set_pixel(x, int(h * 0.82), 255, 240, 170, 0.85)

        elif theme == "airdrop":
            cv.draw_radial_glow(130, 155, 115, 255, 145, 55, 0.55)
            # Bomber silhouette
            bx, by = 270, 68
            for l in range(-28, 28):
                cv.set_pixel(bx + l, by, 18, 14, 22, 1.0)
            for w_span in range(-38, 39):
                cv.set_pixel(bx, by + w_span, 18, 14, 22, 1.0)
            # Parachute descending
            px, py = 160, 118
            cv.draw_radial_glow(px, py, 22, 255, 185, 85, 0.65)
            for angle_deg in range(0, 180, 2):
                rad = math.radians(angle_deg)
                cv.set_pixel(int(px + math.cos(rad) * 18), int(py - math.sin(rad) * 14), 245, 245, 245, 0.95)

        elif theme == "combo":
            cv.draw_mountain_silhouette(h * 0.85, 32, freq=0.016, color=(20, 16, 24), seed=24)
            cv.draw_radial_glow(265, 82, 65, 255, 175, 65, 0.75)
            for l in range(-32, 32):
                cv.set_pixel(265 + l, 82 - l // 2, 245, 245, 245, 1.0)
            cv.set_pixel(297, 66, 255, 60, 60, 1.0)

        elif theme == "hydro":
            # Thermonuclear giant fireball
            cx, cy = 200, 80
            cv.draw_radial_glow(cx, cy, 98, 255, 250, 220, 0.98)
            cv.draw_radial_glow(cx, cy, 145, 255, 165, 45, 0.85)
            cv.draw_radial_glow(cx, cy, 195, 245, 95, 25, 0.45)
            for y in range(int(h * 0.74), h):
                for x in range(w):
                    cv.set_pixel(x, y, 38, 24, 18, 1.0)

        elif theme == "underground":
            cv.draw_mountain_silhouette(h * 0.58, 65, freq=0.014, color=(32, 28, 26), seed=35)
            cv.draw_radial_glow(200, 175, 55, 255, 145, 35, 0.92)
            for ring in [32, 64, 96]:
                for angle_deg in range(0, 360, 2):
                    rad = math.radians(angle_deg)
                    cv.set_pixel(int(200 + math.cos(rad) * ring), int(175 + math.sin(rad) * (ring * 0.6)), 255, 205, 85, 0.55)

        elif theme in ["dfh1", "sj1", "trio"]:
            earth_cx, earth_cy, earth_r = 200, 390, 270
            for y in range(h):
                dy = y - earth_cy
                for x in range(w):
                    dx = x - earth_cx
                    dist = math.sqrt(dx * dx + dy * dy)
                    if dist < earth_r:
                        depth = 1.0 - (dist / earth_r)
                        cv.set_pixel(x, y, int(15 + depth * 30), int(45 + depth * 80), int(115 + depth * 140), 1.0)
                    elif dist < earth_r + 16:
                        alpha = 1.0 - (dist - earth_r) / 16
                        cv.set_pixel(x, y, 105, 185, 255, alpha * 0.75)

            if theme == "dfh1":
                sx, sy = 210, 75
                cv.draw_radial_glow(sx, sy, 35, 255, 225, 135, 0.85)
                for i in range(-28, 29):
                    cv.set_pixel(sx + i, sy + i // 2, 245, 245, 255, 0.95)
                    cv.set_pixel(sx - i, sy + i // 2, 245, 245, 255, 0.95)
            elif theme == "sj1":
                sx, sy = 200, 80
                cv.draw_radial_glow(sx, sy, 30, 56, 189, 248, 0.75)
                for w_span in range(-30, 31):
                    cv.set_pixel(sx + w_span, sy, 125, 215, 255, 1.0)
            elif theme == "trio":
                for sp in [(135, 70), (200, 92), (265, 62)]:
                    cv.draw_radial_glow(sp[0], sp[1], 22, 255, 220, 105, 0.9)
                    cv.set_pixel(sp[0], sp[1], 255, 255, 255, 1.0)

        elif theme == "df5":
            cv.draw_radial_glow(225, 95, 65, 255, 175, 55, 0.85)
            for l in range(0, 32):
                cv.set_pixel(225 + l, 95 - l // 2, 248, 248, 248, 1.0)
            for l in range(-38, -10):
                cv.set_pixel(225 + l, 95 - l // 2 + 10, 165, 165, 175, 0.85)

        elif theme == "fsw":
            cv.draw_radial_glow(195, 115, 55, 255, 125, 35, 0.95)
            cv.draw_radial_glow(195, 115, 85, 255, 65, 25, 0.55)
            for angle_deg in range(0, 180, 2):
                rad = math.radians(angle_deg)
                cv.set_pixel(int(195 + math.cos(rad) * 24), int(76 - math.sin(rad) * 18), 255, 165, 65, 1.0)

        elif theme == "task580":
            for y in range(int(h * 0.64), h):
                depth = (y - h * 0.64) / (h * 0.36)
                for x in range(w):
                    cv.set_pixel(x, y, int(10 + depth * 15), int(42 + depth * 60), int(95 + depth * 80), 1.0)
            cv.draw_radial_glow(215, int(h * 0.74), 48, 65, 245, 125, 0.75)
            hx, hy = 215, 78
            for l in range(-28, 28):
                cv.set_pixel(hx + l, hy - 8, 22, 22, 32, 1.0)
            for l in range(-16, 16):
                cv.set_pixel(hx + l, hy, 22, 22, 32, 1.0)

        elif theme == "jl1":
            for y in range(int(h * 0.68), h):
                for x in range(w):
                    cv.set_pixel(x, y, 12, 34, 64, 1.0)
            # Water spray column
            cv.draw_radial_glow(200, int(h * 0.64), 58, 210, 235, 255, 0.85)
            # Rocket motor fire
            cv.draw_radial_glow(200, int(h * 0.44), 48, 255, 165, 45, 0.98)
            for l in range(-28, 28):
                cv.set_pixel(200, int(h * 0.38) - l, 245, 245, 250, 1.0)

        cv.apply_vignette()
        save_png(w, h, cv.buf, f"public/assets/images/milestone_{idx}.png")

    print("Milestones regenerated.")

if __name__ == "__main__":
    generate_hero_banner()
    generate_milestones()
