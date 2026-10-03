# 전체 캡처에서 길게 빈(거의 한 색) 띠를 줄인다 : py collapse.py <입력.png> <출력.png> [최소 길이=160] [남길 길이=60]
import sys
from PIL import Image, ImageStat
src, dst = sys.argv[1], sys.argv[2]
MIN = int(sys.argv[3]) if len(sys.argv) > 3 else 160
KEEP = int(sys.argv[4]) if len(sys.argv) > 4 else 60
im = Image.open(src).convert('RGB'); W, H = im.size
small = im.resize((W // 8, H), Image.BILINEAR)
flat = []
for y in range(H):
    row = small.crop((0, y, small.width, y + 1)); st = ImageStat.Stat(row)
    flat.append(max(st.stddev) < 2.5)
keep = []; y = 0
while y < H:
    if flat[y]:
        e = y
        while e < H and flat[e]: e += 1
        keep.append((y, e if e - y < MIN else y + KEEP)); y = e
    else:
        e = y
        while e < H and not flat[e]: e += 1
        keep.append((y, e)); y = e
out = Image.new('RGB', (W, sum(b - a for a, b in keep)), 'white'); oy = 0
for a, b in keep: out.paste(im.crop((0, a, W, b)), (0, oy)); oy += b - a
out.save(dst); print(H, '->', out.height)
