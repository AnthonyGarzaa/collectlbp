from PIL import Image
from collections import deque

SRC = r'C:\Users\chris\Desktop\collectparappa\LammyStuff\ressources\harmonizer.png'


def is_near_white(p):
    r, g, b, a = p
    if a == 0:
        return False
    if min(r, g, b) < 200:
        return False
    if max(r, g, b) - min(r, g, b) > 30:
        return False
    return True


im = Image.open(SRC).convert('RGBA')
w, h = im.size
data = list(im.getdata())

white_mask = bytearray(w * h)
for i, p in enumerate(data):
    if is_near_white(p):
        white_mask[i] = 1

visited = bytearray(w * h)
q = deque()

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

while q:
    x, y = q.popleft()
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < w and 0 <= ny < h:
            j = ny * w + nx
            if white_mask[j] and not visited[j]:
                visited[j] = 1
                q.append((nx, ny))

cleared = 0
for i in range(w * h):
    if visited[i]:
        r, g, b, _ = data[i]
        data[i] = (r, g, b, 0)
        cleared += 1
print(f'cleared {cleared} white halo pixels wrapping the figure')

out = Image.new('RGBA', (w, h))
out.putdata(data)
out.save(SRC)
print('saved', SRC)
