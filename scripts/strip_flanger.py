from PIL import Image
from collections import deque

SRC = r'C:\Users\chris\Desktop\collectparappa\LammyStuff\ressources\flanger.png'

im = Image.open(SRC).convert('RGBA')
w, h = im.size
data = list(im.getdata())


def is_black(p):
    r, g, b, a = p
    return a > 0 and r < 90 and g < 90 and b < 90


def is_near_white(p):
    r, g, b, a = p
    if a == 0:
        return False
    if min(r, g, b) < 236:
        return False
    if max(r, g, b) - min(r, g, b) > 12:
        return False
    return True


# ── Pass 1: flood-fill external white background from image borders ──
mask_white = bytearray(w * h)
for i, p in enumerate(data):
    if is_near_white(p):
        mask_white[i] = 1

visited = bytearray(w * h)
q = deque()
for x in range(w):
    for y in (0, h - 1):
        i = y * w + x
        if mask_white[i] and not visited[i]:
            visited[i] = 1
            q.append((x, y))
for y in range(h):
    for x in (0, w - 1):
        i = y * w + x
        if mask_white[i] and not visited[i]:
            visited[i] = 1
            q.append((x, y))

while q:
    x, y = q.popleft()
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < w and 0 <= ny < h:
            j = ny * w + nx
            if mask_white[j] and not visited[j]:
                visited[j] = 1
                q.append((nx, ny))

cleared_white = 0
for i in range(w * h):
    if visited[i]:
        r, g, b, _ = data[i]
        data[i] = (r, g, b, 0)
        cleared_white += 1
print(f'pass 1: cleared {cleared_white} external white pixels')

# ── Compute the "outside" region: flood from transparent, blocked by black ──
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
            if is_black(data[j]):
                continue
            outside[j] = 1
            q.append((nx, ny))

# ── Pass 2: clear colored pixels in the outside region ──
cleared_color = 0
for i in range(w * h):
    if not outside[i]:
        continue
    r, g, b, a = data[i]
    if a == 0:
        continue
    if max(r, g, b) - min(r, g, b) > 25:
        data[i] = (r, g, b, 0)
        cleared_color += 1
print(f'pass 2: cleared {cleared_color} colored pixels outside the outline')

# ── Pass 3: clear bright halo wrapping the outline ──
cleared_halo = 0
for i in range(w * h):
    if not outside[i]:
        continue
    r, g, b, a = data[i]
    if a == 0:
        continue
    data[i] = (r, g, b, 0)
    cleared_halo += 1
print(f'pass 3: cleared {cleared_halo} bright halo pixels')

out = Image.new('RGBA', (w, h))
out.putdata(data)
out.save(SRC)
print('saved', SRC)
