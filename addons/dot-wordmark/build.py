# 점 워드마크 다시 만들기 : py addons/dot-wordmark/build.py <워드마크 이미지…>
#   이미지 파일 이름(확장자 뺀 것)이 키가 된다 → 사이트의 워드마크 주소에 그 이름이 들어 있으면 점으로 바뀐다
#   글자 모양(알파 128 이상)을 400칸 너비 점 지도로, 색은 진한 부분의 평균색으로 masks.json 에 담고 dot-wordmark.js 를 다시 쓴다
import sys, os, json, base64
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
path = os.path.join(here, 'masks.json')
M = json.load(open(path)) if os.path.exists(path) else {}
for f in sys.argv[1:]:
    im = Image.open(f).convert('RGBA'); w, h = im.size
    MW = 400; MH = round(h * MW / w); px = im.resize((MW, MH), Image.LANCZOS).load()
    by = bytearray((MW * MH + 7) // 8); rs = gs = bs = n = 0
    for y in range(MH):
        for x in range(MW):
            r, g, b, a = px[x, y]; i = y * MW + x
            if a >= 128: by[i >> 3] |= 1 << (7 - (i & 7))
            if a > 200: rs += r; gs += g; bs += b; n += 1
    M[os.path.splitext(os.path.basename(f))[0].replace('wm-', '')] = {'w': MW, 'h': MH, 'c': '#%02x%02x%02x' % (rs // n, gs // n, bs // n), 'm': base64.b64encode(bytes(by)).decode()}
json.dump(M, open(path, 'w'))
src = open(os.path.join(here, 'dot-wordmark.src.js'), encoding='utf-8').read()
open(os.path.join(here, 'dot-wordmark.js'), 'w', encoding='utf-8').write(src.replace('__MASKS__', json.dumps(M)))
print(sorted(M))
