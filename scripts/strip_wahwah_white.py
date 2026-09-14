from PIL import Image
from collections import deque

SRC = r'C:\Users\chris\Desktop\collectparappa\LammyStuff\ressources\wahwah.png'

im = Image.open(SRC).convert('RGBA')
w, h = im.size
data = list(im.getdata())

def is_black(p):
    r, g, b, a = p
    return a > 0 and r < 90 and g < 90 and b < 90

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
            p = data[j]
            if is_black(p):
                continue
            outside[j] = 1
            q.append((nx, ny))

cleared = 0
for i in range(w * h):
    if not outside[i]:
        continue
    r, g, b, a = data[i]
    if a == 0:
        continue
    if min(r, g, b) >= 170:
        data[i] = (r, g, b, 0)
        cleared += 1

print(f'cleared {cleared} bright halo pixels wrapping the outline')

out = Image.new('RGBA', (w, h))
out.putdata(data)
out.save(SRC)
print('saved', SRC)
