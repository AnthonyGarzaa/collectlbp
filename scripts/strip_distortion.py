from PIL import Image
from collections import deque

SRC = r'C:\Users\chris\Desktop\collectparappa\LammyStuff\ressources\distortion.png'
BAND_DEPTH = 8


def is_brown_outline(p):
    r, g, b, a = p
    if a == 0:
        return False
    if max(r, g, b) > 100:
        return False
    if r < g or r < b:
        return False
    return True


def is_bg_white(p):
    r, g, b, a = p
    if a == 0:
        return False
    if min(r, g, b) < 200:
        return False
    if max(r, g, b) - min(r, g, b) > 22:
        return False
    return True


def is_halo_white(p):
    r, g, b, a = p
    if a == 0:
        return False
    if min(r, g, b) < 150:
        return False
    if max(r, g, b) - min(r, g, b) > 40:
        return False
    return True


im = Image.open(SRC).convert('RGBA')
w, h = im.size
data = list(im.getdata())

# ── Pass 1: flood-fill background whites connected to image borders ──
white_mask = bytearray(w * h)
for i, p in enumerate(data):
    if is_bg_white(p):
        white_mask[i] = 1

visited = bytearray(w * h)
q = deque()
for i, p in enumerate(data):
    if p[3] == 0:
        x, y = i % w, i // w
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h:
                j = ny * w + nx
                if white_mask[j] and not visited[j]:
                    visited[j] = 1
                    q.append((nx, ny))
for x in range(w):
    for y in (0, h - 1):
        i = y * w + x
        if white_mask[i] and not visited[i]:
            visited[i] = 1
            q.append((x, y))
for y in range(h):
    for x in (0, w - 1):
        i = y * w + x
        if white_mask[i] and not visited[i]:
            visited[i] = 1
            q.append((x, y))
while q:
    x, y = q.popleft()
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < w and 0 <= ny < h:
            j = ny * w + nx
            if white_mask[j] and not visited[j]:
                visited[j] = 1
                q.append((nx, ny))

cleared_bg = 0
for i in range(w * h):
    if visited[i]:
        r, g, b, _ = data[i]
        data[i] = (r, g, b, 0)
        cleared_bg += 1
print(f'pass 1: cleared {cleared_bg} background white pixels')

# ── Pass 2: bounded band of halo whites around brown outline ──
outside = bytearray(w * h)
q = deque()
for i, p in enumerate(data):
    if p[3] == 0:
        outside[i] = 1
        q.append((i % w, i // w))
while q:
    x, y = q.popleft()
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < w and 0 <= ny < h:
            j = ny * w + nx
            if outside[j]:
                continue
            if is_brown_outline(data[j]):
                continue
            outside[j] = 1
            q.append((nx, ny))

depth = [-1] * (w * h)
q = deque()
for i in range(w * h):
    if not outside[i]:
        continue
    x, y = i % w, i // w
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < w and 0 <= ny < h and is_brown_outline(data[ny * w + nx]):
            depth[i] = 0
            q.append((x, y))
            break
while q:
    x, y = q.popleft()
    cur = depth[y * w + x]
    if cur >= BAND_DEPTH:
        continue
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < w and 0 <= ny < h:
            j = ny * w + nx
            if not outside[j]:
                continue
            if depth[j] != -1:
                continue
            depth[j] = cur + 1
            q.append((nx, ny))

cleared_halo = 0
for i in range(w * h):
    if not outside[i]:
        continue
    if depth[i] < 0 or depth[i] > BAND_DEPTH:
        continue
    if not is_halo_white(data[i]):
        continue
    r, g, b, _ = data[i]
    data[i] = (r, g, b, 0)
    cleared_halo += 1
print(f'pass 2: cleared {cleared_halo} halo white pixels within {BAND_DEPTH}px of outline')

# ── Pass 3: clear remaining whitish pixels on the strict right side (x > 430) ──
# Center zone (axe blade) is x <= 430, fully preserved.
cleared_right = 0
for i in range(w * h):
    x = i % w
    if x <= 430:
        continue
    r, g, b, a = data[i]
    if a == 0:
        continue
    if min(r, g, b) < 180:
        continue
    if max(r, g, b) - min(r, g, b) > 40:
        continue
    data[i] = (r, g, b, 0)
    cleared_right += 1
print(f'pass 3: cleared {cleared_right} whitish pixels on the right side (x>430)')

out = Image.new('RGBA', (w, h))
out.putdata(data)
out.save(SRC)
print('saved', SRC)
