"""Channel-owned sets: study, rooftop, diner. Same plane conventions as interiors.py.

  study    the host's archive study: teal wallpaper, bookshelf, red-string evidence board, window onto the city, desk lamp.
  rooftop  city rooftop: layered skyline, water tower, vents, antenna, parapet, gravel roof.
  diner    all-night diner: neon window, checker floor, pie case, counter with stools.

Actors stand at y 1400-1700 (study, diner) or y 1600-1800 (rooftop), z 1.0.
"""
import math

import skia

from .paint import (fill, stroke, ink, shade, mix, path_poly, path_smooth, rrect, ellipse, lin_grad, rad_grad,
                    argb, rng, surface, draw_tex_quad)
from . import textures as tx
from . import setkit as sk
from .light import MOODS, halo, pool, god_rays
from .text import draw_text
from .interiors import room_box

NIGHT = ('night',)
BRAND_RED = '#c42d3f'


# =============================================================================== STUDY
def study(mood):
    m = MOODS[mood]
    night = mood in NIGHT
    E = []
    back = (-40, 250, 1120, 1260)

    def room(cv):
        wall = tx.wallpaper(1200, 1000, base='#2f5a5e', motif='#3d7074', stripe='#2a5156', step=64)
        room_box(cv, back, back_tex=wall,
                 left_tex=tx.wallpaper(1200, 1600, base='#2a4f53', motif='#37676b', stripe='#264a4e', step=64),
                 right_tex=tx.wallpaper(1200, 1600, base='#2a4f53', motif='#37676b', stripe='#264a4e', step=64),
                 floor_tex=tx.wood_planks(1400, 1400, plank=150, base='#6a4026', seed=3, nails=False),
                 ceil_tex=tx.ceiling_tiles(1400, 1200, size=170, base='#d9d2c4'), right_shade=0.24, left_shade=0.12)
        # wainscot panelling along the back wall
        cv.drawRect(skia.Rect.MakeLTRB(back[0], 960, back[2], back[3]), fill('#4a2e1e'))
        for k in range(8):
            x = 20 + k * 150
            cv.drawPath(rrect(x, 990, 120, 220, 8), stroke(shade('#4a2e1e', -0.4), 5))
        cv.drawLine(back[0], 960, back[2], 960, ink(4))
        cv.drawRect(skia.Rect.MakeLTRB(back[0], 950, back[2], 966), fill('#6a4228'))
        # window on the right with a skyline
        wx, wy, ww, wh = 760, 380, 270, 470
        sv = surface(ww, wh); sc = sv.getCanvas()
        sk.sky(sc, m, x0=0, y0=0, x1=ww, y1=wh, clouds=2, seed=14, cloud_band=(30, 140), cloud_scale=0.45,
               stars=30 if night else 0, moon=(190, 90, 24) if night else None)
        for k, (bx, bh_, bc) in enumerate(((0, 190, '#3a4678'), (70, 260, '#46528a'), (150, 170, '#3a4678'), (200, 230, '#505c94'))):
            sc.drawRect(skia.Rect.MakeXYWH(bx, wh - bh_, 66, bh_), fill(bc))
            for j in range(int(bh_ / 34)):
                if (j + k) % 2 == 0:
                    sc.drawRect(skia.Rect.MakeXYWH(bx + 14, wh - bh_ + 14 + j * 34, 12, 14), fill('#f6e4a0' if night else '#cfe0f2'))
        cv.drawImage(sv.makeImageSnapshot(), wx, wy)
        cv.drawRect(skia.Rect.MakeXYWH(wx + ww / 2 - 5, wy, 10, wh), fill('#3a2418'))
        cv.drawRect(skia.Rect.MakeXYWH(wx, wy + wh / 2 - 5, ww, 10), fill('#3a2418'))
        cv.drawRect(skia.Rect.MakeXYWH(wx - 12, wy - 12, ww + 24, wh + 24), stroke('#5a3822', 18))
        cv.drawRect(skia.Rect.MakeXYWH(wx - 21, wy - 21, ww + 42, wh + 42), ink(3.5))
        cv.drawRect(skia.Rect.MakeXYWH(wx, wy, ww, wh), ink(3))
        # evidence board: cork, photos, red string
        bx, by, bw, bh = 330, 330, 400, 520
        cv.drawPath(rrect(bx, by, bw, bh, 10), fill('#b98652')); cv.drawPath(rrect(bx, by, bw, bh, 10), ink(5))
        cv.drawPath(rrect(bx + 12, by + 12, bw - 24, bh - 24, 6), stroke('#8a5e36', 4))
        pins = []
        for i, (px, py, rot, col) in enumerate(((bx + 50, by + 60, -6, '#f4f0e8'), (bx + 230, by + 50, 5, '#f4f0e8'),
                                                (bx + 60, by + 260, 4, '#f6e27a'), (bx + 240, by + 290, -4, '#f4f0e8'),
                                                (bx + 150, by + 410, 3, '#a8d8f0'))):
            cv.save(); cv.rotate(rot, px + 55, py + 60)
            cv.drawPath(rrect(px, py, 110, 130 if i != 2 and i != 4 else 90, 4), fill(col))
            cv.drawPath(rrect(px, py, 110, 130 if i != 2 and i != 4 else 90, 4), ink(3))
            if i in (0, 1, 3):
                cv.drawCircle(px + 55, py + 52, 26, fill('#d8c8b8')); cv.drawCircle(px + 55, py + 52, 26, ink(2.5))
                cv.drawRect(skia.Rect.MakeXYWH(px + 34, py + 84, 42, 30), fill('#6a6a86'))
            else:
                for j in range(3):
                    cv.drawLine(px + 14, py + 22 + j * 20, px + 92 - j * 10, py + 22 + j * 20, stroke('#6a6a7a', 3))
            cv.restore()
            pins.append((px + 55, py + 10))
        for a, b in ((0, 1), (1, 3), (3, 4), (0, 2), (2, 4)):
            p = skia.Path(); p.moveTo(*pins[a]); p.quadTo((pins[a][0] + pins[b][0]) / 2 + 8, (pins[a][1] + pins[b][1]) / 2 + 22, *pins[b])
            cv.drawPath(p, stroke(BRAND_RED, 3.5, 0.95))
        for (px, py) in pins:
            cv.drawCircle(px, py, 7, fill(BRAND_RED)); cv.drawCircle(px, py, 7, ink(2))
        # bookshelf on the left wall of the back wall
        sx0, sy0, sw, sh = -30, 300, 330, 700
        cv.drawPath(rrect(sx0, sy0, sw, sh, 6), fill('#5a3622')); cv.drawPath(rrect(sx0, sy0, sw, sh, 6), ink(4.5))
        r = rng(8)
        for row in range(4):
            y = sy0 + 24 + row * 166
            cv.drawRect(skia.Rect.MakeXYWH(sx0 + 14, y + 130, sw - 28, 14), fill('#7a4a2e'))
            x = sx0 + 20
            while x < sx0 + sw - 40:
                bw_ = r.uniform(26, 46); bh_ = r.uniform(86, 126)
                col = r.choice(['#8a2a33', '#2a4a78', '#c8a048', '#3f6a4a', '#6a3a78', '#d8d0c0'])
                cv.drawRect(skia.Rect.MakeXYWH(x, y + 130 - bh_, bw_, bh_), fill(col))
                cv.drawRect(skia.Rect.MakeXYWH(x, y + 130 - bh_, bw_, bh_), ink(2.4))
                cv.drawLine(x + 6, y + 130 - bh_ + 14, x + bw_ - 6, y + 130 - bh_ + 14, stroke(shade(col, 0.35), 2.5))
                x += bw_ + 3
        cv.drawPath(ellipse(970, 1180, 60, 16), fill('#1a1420', 0.4))
        sk.plant_pot(cv, 1010, 1220, 1.5)

    def desk(cv):
        top = 1440
        draw_tex_quad(cv, tx.wood_planks(2000, 500, plank=130, base='#8a5430', seed=9, nails=False),
                      [(-100, 1290), (1180, 1290), (1420, top), (-340, top)])
        cv.drawLine(-340, top, 1420, top, ink(4.5))
        cv.drawRect(skia.Rect.MakeLTRB(-340, top, 1420, top + 38), fill('#5a3220')); cv.drawLine(-340, top + 38, 1420, top + 38, ink(4))
        cv.drawImage(tx.wood_planks(1800, 1000, plank=170, base='#6a3a24', vertical=True, seed=10, nails=False), -340, top + 38)
        for k in range(3):
            cv.drawPath(rrect(-120 + k * 560, top + 120, 440, 300, 14), stroke(shade('#6a3a24', -0.4), 6))
            cv.drawCircle(100 + k * 560, top + 260, 14, fill('#e6c25a')); cv.drawCircle(100 + k * 560, top + 260, 14, ink(3))
        # banker's lamp: green shade, brass stem (practical)
        cv.drawPath(ellipse(130, 1405, 74, 16), fill('#b8902e')); cv.drawPath(ellipse(130, 1405, 74, 16), ink(3.5))
        cv.drawLine(130, 1400, 130, 1300, stroke('#b8902e', 14)); cv.drawLine(130, 1400, 130, 1300, ink(3, 0.0))
        shade_p = path_poly([(40, 1310), (220, 1310), (190, 1220), (70, 1220)])
        cv.drawPath(shade_p, fill('#2a7a5a')); cv.drawPath(shade_p, ink(4))
        cv.drawPath(ellipse(130, 1312, 90, 12), fill('#f6e8b0')); cv.drawPath(ellipse(130, 1312, 90, 12), ink(3))
        E.append(dict(kind='lamp', pos=(130, 1318), r=470, lit=True, ground=None))
        # globe, tea cup, stacked folders, brand-red file
        cv.drawLine(470, 1400, 470, 1346, stroke('#b8902e', 8))
        cv.drawCircle(470, 1292, 56, fill('#4f8ad8')); cv.drawCircle(470, 1292, 56, ink(4))
        cv.drawPath(path_smooth([(440, 1270), (480, 1258), (500, 1290), (470, 1304), (446, 1296)]), fill('#6ab04a'))
        cv.drawPath(path_smooth([(440, 1270), (480, 1258), (500, 1290), (470, 1304), (446, 1296)]), ink(2.4))
        for k in range(3):
            cv.drawPath(rrect(660, 1380 - k * 26, 220, 26, 4), fill(['#d8c8a0', BRAND_RED, '#e0d4b4'][k]))
            cv.drawPath(rrect(660, 1380 - k * 26, 220, 26, 4), ink(3))
        cv.drawPath(rrect(940, 1366, 70, 40, 8), fill('#f4f0e8')); cv.drawPath(rrect(940, 1366, 70, 40, 8), ink(3))
        cv.drawPath(ellipse(975, 1368, 30, 7), fill('#6a3a22'))

    def lights_room(cv, mm):
        sk.draw_emitters(cv, [e for e in E if e['kind'] == 'lamp'], mm, night)
        if mood in ('golden', 'sunset', 'dawn'):
            god_rays(cv, (900, 520), 215, 70, 1400, n=7, col=mm['key'], a=0.18)

    def lights_desk(cv, mm):
        sk.draw_emitters(cv, [e for e in E if e['kind'] == 'lamp'], mm, True)

    def near(cv):
        cv.drawPath(path_smooth([(-120, 2100), (-60, 1700), (120, 1640), (240, 2100)]), fill('#1f1a24'))
        cv.drawPath(rrect(-90, 1830, 330, 360, 30), fill('#4a2e1e'))

    return [
        ('room', 1.5, room, dict(lights=lights_room)),
        ('desk', 1.0, desk, dict(lights=lights_desk)),
        ('near', 0.58, near, dict(blur=12)),
    ], dict(ground_y=1440, board=(530, 590), lamp=(130, 1318))


# =============================================================================== ROOFTOP
def rooftop(mood):
    m = MOODS[mood]
    night = mood in NIGHT
    E = []

    def sky(cv):
        sk.sky(cv, m, seed=31, clouds=7, cloud_band=(-300, 700), cloud_scale=1.2,
               moon=(250, 190, 62) if night else None, stars=180 if night else 0,
               sun=(900, 330, 66) if mood in ('day', 'golden') else None)

    def skyline(cv):
        r = rng(5)
        base_y = 1280
        for layer, (col, hmin, hmax, wmin, wmax) in enumerate(((mix(m['fog'], '#6a7aa8', 0.5), 220, 420, 60, 120),
                                                               (mix('#4a5688', m['fog'], 0.25), 160, 340, 70, 140))):
            x = -500 if layer == 0 else -520
            while x < 1600:
                w = r.uniform(wmin, wmax); h = r.uniform(hmin, hmax)
                cv.drawRect(skia.Rect.MakeXYWH(x, base_y - h - layer * 0, w, h + 400), fill(col))
                cv.drawRect(skia.Rect.MakeXYWH(x, base_y - h, w, h + 400), ink(3, 0.55))
                for j in range(int(h / 46)):
                    for i in range(int(w / 34)):
                        if r.random() < (0.45 if night else 0.18):
                            wc = '#f8e8a0' if night else '#cfe0f2'
                            cv.drawRect(skia.Rect.MakeXYWH(x + 8 + i * 34, base_y - h + 14 + j * 46, 16, 22), fill(wc, 0.9))
                            if night and r.random() < 0.25:
                                E.append(dict(kind='window', rect=(x + 8 + i * 34, base_y - h + 14 + j * 46, 16, 22)))
                x += w + r.uniform(2, 20)
            base_y += 90
        # a landmark tower with the brand-red beacon
        cv.drawRect(skia.Rect.MakeXYWH(760, 600, 56, 800), fill(mix('#4a5688', m['fog'], 0.2)))
        cv.drawRect(skia.Rect.MakeXYWH(760, 600, 56, 800), ink(3, 0.6))
        cv.drawLine(788, 600, 788, 480, stroke('#2a2a3e', 6))
        cv.drawCircle(788, 474, 10, fill(BRAND_RED))
        E.append(dict(kind='lamp', pos=(788, 474), r=150, lit=True, ground=None))

    def roof(cv):
        top = 1480
        cv.drawRect(skia.Rect.MakeLTRB(-600, top, 1700, 2700), fill('#5a5868'))
        cv.drawImage(tx.gravel(2400, 1300), -600, top)
        cv.drawRect(skia.Rect.MakeLTRB(-600, top, 1700, top + 30), fill('#8a8898')); cv.drawLine(-600, top + 30, 1700, top + 30, ink(4))
        cv.drawRect(skia.Rect.MakeLTRB(-600, top - 44, 1700, top), fill('#7a788a')); cv.drawLine(-600, top - 44, 1700, top - 44, ink(4))
        for k in range(14):
            cv.drawLine(-560 + k * 170, top - 44, -560 + k * 170, top, stroke('#5a586a', 3))
        # water tower
        wx = 150
        for lx in (-50, 50):
            cv.drawLine(wx + lx, top - 44, wx + lx * 1.2, top - 360, stroke('#3a2a2a', 12))
        cv.drawPath(rrect(wx - 110, top - 640, 220, 290, 20), fill('#8a5a3a')); cv.drawPath(rrect(wx - 110, top - 640, 220, 290, 20), ink(5))
        for k in range(1, 5):
            cv.drawLine(wx - 108, top - 640 + k * 58, wx + 108, top - 640 + k * 58, stroke('#5a3a24', 4))
        cv.drawPath(path_poly([(wx - 124, top - 640), (wx, top - 730), (wx + 124, top - 640)]), fill('#6a3a28'))
        cv.drawPath(path_poly([(wx - 124, top - 640), (wx, top - 730), (wx + 124, top - 640)]), ink(5))
        # vents, antenna, access door
        cv.drawPath(rrect(650, top - 170, 190, 126, 8), fill('#9a98a8')); cv.drawPath(rrect(650, top - 170, 190, 126, 8), ink(4))
        for k in range(4):
            cv.drawLine(664, top - 140 + k * 22, 826, top - 140 + k * 22, stroke('#6a6878', 4))
        cv.drawPath(rrect(900, top - 250, 150, 206, 8), fill('#5a6078')); cv.drawPath(rrect(900, top - 250, 150, 206, 8), ink(4))
        cv.drawRect(skia.Rect.MakeXYWH(930, top - 220, 90, 176), fill('#2a2a3e')); cv.drawRect(skia.Rect.MakeXYWH(930, top - 220, 90, 176), ink(3))
        E.append(dict(kind='lamp', pos=(975, top - 270), r=210, lit=True, ground=top))
        cv.drawCircle(975, top - 270, 12, fill('#f6e8b0')); cv.drawCircle(975, top - 270, 12, ink(3))
        cv.drawLine(520, top - 44, 520, top - 400, stroke('#2a2a3e', 7))
        for k in range(4):
            cv.drawLine(480 + k * 4, top - 360 + k * 70, 560 - k * 4, top - 360 + k * 70, stroke('#2a2a3e', 5))

    def lights_sky(cv, mm):
        pass

    def lights_far(cv, mm):
        sk.draw_emitters(cv, [e for e in E if e['kind'] in ('window',)], mm, night)
        for e in E:
            if e['kind'] == 'lamp' and e['pos'][0] == 788:
                halo(cv, e['pos'][0], e['pos'][1], e['r'], (255, 70, 80), 0.8)

    def lights_roof(cv, mm):
        sk.draw_emitters(cv, [e for e in E if e['kind'] == 'lamp' and e['pos'][0] != 788], mm, night)

    def near(cv):
        cv.drawPath(path_smooth([(-100, 2150), (-60, 1840), (200, 1790), (260, 2150)]), fill('#2a2634'))
        cv.drawRect(skia.Rect.MakeXYWH(960, 1900, 260, 300), fill('#4a4658'))

    return [
        ('sky', 30.0, sky, dict(grade=False)),
        ('skyline', 5.0, skyline, dict(lights=lights_far, haze=0.18)),
        ('roof', 1.0, roof, dict(lights=lights_roof)),
        ('near', 0.58, near, dict(blur=12)),
    ], dict(ground_y=1700)


# =============================================================================== DINER
def diner(mood):
    m = MOODS[mood]
    night = mood in NIGHT
    E = []
    back = (-40, 240, 1120, 1250)

    def room(cv):
        room_box(cv, back,
                 back_tex=tx.clapboard(1200, 1020, board=50, base='#e8d7b0'),
                 left_tex=tx.clapboard(1200, 1600, board=50, base='#d8c7a0'),
                 right_tex=tx.clapboard(1200, 1600, board=50, base='#d8c7a0'),
                 floor_tex=tx.checker_tiles(1400, 1400, size=190, c1='#f2ece0', c2='#2a2a3e', gloss=True),
                 ceil_tex=tx.ceiling_tiles(1400, 1200, size=170), right_shade=0.2, left_shade=0.1)
        # big front window with neon "OPEN" in brand red
        wx, wy, ww, wh = 90, 340, 620, 470
        sv = surface(ww, wh); sc = sv.getCanvas()
        sk.sky(sc, m, x0=0, y0=0, x1=ww, y1=wh, clouds=2, seed=18, cloud_band=(30, 160), cloud_scale=0.5,
               stars=40 if night else 0)
        sc.drawRect(skia.Rect.MakeXYWH(0, wh - 110, ww, 110), fill('#2a2a3e'))
        for k in range(4):
            sc.drawRect(skia.Rect.MakeXYWH(30 + k * 150, wh - 220 + (k % 2) * 40, 90, 220), fill('#3a4678'))
        cv.drawImage(sv.makeImageSnapshot(), wx, wy)
        cv.drawRect(skia.Rect.MakeXYWH(wx - 14, wy - 14, ww + 28, wh + 28), stroke('#c8c4bc', 20))
        cv.drawRect(skia.Rect.MakeXYWH(wx - 24, wy - 24, ww + 48, wh + 48), ink(4))
        cv.drawLine(wx + ww / 2, wy, wx + ww / 2, wy + wh, stroke('#c8c4bc', 12))
        cv.drawPath(rrect(wx + 160, wy + 70, 300, 90, 40), stroke('#ff3b52', 10))
        draw_text(cv, 'OPEN', wx + 310, wy + 138, 64, '#ff7686')
        E.append(dict(kind='neon', pos=(wx + 310, wy + 115), r=360))
        # menu board and a wall clock
        cv.drawPath(rrect(780, 360, 270, 320, 10), fill('#2a2a3e')); cv.drawPath(rrect(780, 360, 270, 320, 10), ink(4.5))
        draw_text(cv, 'PIE', 915, 424, 40, '#f6e27a')
        for k, price in enumerate(('3.50', '4.00', '2.75', '5.25')):
            cv.drawLine(808, 470 + k * 50, 900, 470 + k * 50, stroke('#e8e4dc', 4))
            draw_text(cv, price, 990, 478 + k * 50, 26, '#e8e4dc')
        sk.wall_clock(cv, 915, 760, 56)
        # booth seats along the back (red vinyl)
        for sx in (-10, 400, 810):
            cv.drawPath(rrect(sx, 1000, 330, 230, 40), fill('#b8322f')); cv.drawPath(rrect(sx, 1000, 330, 230, 40), ink(4.5))
            for k in range(3):
                cv.drawLine(sx + 60 + k * 100, 1020, sx + 60 + k * 100, 1210, stroke(shade('#b8322f', -0.3), 4))
        cv.drawRect(skia.Rect.MakeXYWH(-40, 1230, 1180, 36), fill('#2a2a3e'))

    def counter(cv):
        top = 1420
        draw_tex_quad(cv, tx.checker_tiles(2000, 500, size=160, c1='#f2ece0', c2='#8a8a9e', gloss=True),
                      [(-120, 1300), (1200, 1300), (1440, top), (-360, top)])
        cv.drawLine(-360, top, 1440, top, ink(4.5))
        cv.drawRect(skia.Rect.MakeLTRB(-360, top, 1440, top + 34), fill('#c8c4bc')); cv.drawLine(-360, top + 34, 1440, top + 34, ink(4))
        cv.drawRect(skia.Rect.MakeLTRB(-360, top + 34, 1440, 2200), fill('#2f6a8a'))
        for k in range(8):
            cv.drawLine(-300 + k * 240, top + 34, -300 + k * 240, 2200, stroke(shade('#2f6a8a', -0.35), 4))
        # pie case
        cv.drawPath(rrect(60, 1180, 330, 240, 12), fill('#cfe6ee', 0.55)); cv.drawPath(rrect(60, 1180, 330, 240, 12), ink(4))
        for k in range(2):
            cv.drawLine(70, 1250 + k * 70, 380, 1250 + k * 70, stroke('#9aa8b0', 4))
            for j in range(3):
                pc = ['#d8903a', BRAND_RED, '#e8c060'][(j + k) % 3]
                cv.drawPath(path_poly([(90 + j * 96, 1250 + k * 70), (160 + j * 96, 1250 + k * 70), (126 + j * 96, 1214 + k * 70)]), fill(pc))
                cv.drawPath(path_poly([(90 + j * 96, 1250 + k * 70), (160 + j * 96, 1250 + k * 70), (126 + j * 96, 1214 + k * 70)]), ink(2.6))
        # coffee pot, mug, napkin dispenser, sugar
        cv.drawPath(rrect(560, 1330, 120, 90, 10), fill('#3a3a4e')); cv.drawPath(rrect(560, 1330, 120, 90, 10), ink(3.5))
        cv.drawPath(rrect(580, 1300, 80, 40, 14), fill('#cfe6ee', 0.6)); cv.drawPath(rrect(580, 1300, 80, 40, 14), ink(3))
        cv.drawPath(rrect(780, 1360, 70, 60, 10), fill('#f4f0e8')); cv.drawPath(rrect(780, 1360, 70, 60, 10), ink(3))
        cv.drawPath(rrect(900, 1350, 90, 70, 6), fill('#c8c4bc')); cv.drawPath(rrect(900, 1350, 90, 70, 6), ink(3))
        for k in range(3):
            cv.drawLine(912, 1362 + k * 14, 978, 1362 + k * 14, stroke('#8a8a9e', 3))

    def stools(cv):
        for sx in (80, 620, 1150):
            cv.drawLine(sx, 1960, sx, 2200, stroke('#c8c4bc', 22)); cv.drawLine(sx, 1960, sx, 2200, ink(3, 0.0))
            cv.drawPath(ellipse(sx, 1940, 120, 38), fill('#b8322f')); cv.drawPath(ellipse(sx, 1940, 120, 38), ink(5))

    def lights_room(cv, mm):
        for e in E:
            if e['kind'] == 'neon':
                halo(cv, e['pos'][0], e['pos'][1], e['r'], (255, 70, 100), 0.55 if night else 0.18, core=0.3, hot=False)

    return [
        ('room', 1.5, room, dict(lights=lights_room)),
        ('counter', 1.0, counter, dict()),
        ('stools', 0.58, stools, dict(blur=12)),
    ], dict(ground_y=1420)


REGISTRY = {'study': study, 'rooftop': rooftop, 'diner': diner}
