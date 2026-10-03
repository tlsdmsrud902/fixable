# 카페24 디자인 복구 파일 만들기 — 내려받은 백업 원본이 없을 때
#   python3 docs/tools/make-restore.py [파일 이름]      (기본 : fixable902_s2_261004003838_d_base_E.tar.gz)
#   → _deploy/<파일 이름>
# - 최상위 폴더 이름은 base (새 계정 기본 디자인 = 쇼핑몰 기본디자인, 디자인 코드 base)
# - 스킨 이미지(SkinImg/fixable/)도 함께 넣는다 → /SkinImg/fixable/… 주소 그대로 쓴다 (파일업로더 · pg 번호 불필요)
# - 주문서 바로가기(심볼릭 링크) 51개는 카페24 서버 공통 경로라, 템플릿 백업(docs/tools/restore-links.txt)에서 그대로 만든다
# 백업 원본이 있으면 docs/pack.py 를 쓰는 편이 안전하다 (원본의 링크 · 폴더를 그대로 유지)
import io, os, sys, tarfile, time

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SKIN = os.path.join(ROOT, 'fixable902_s2_260925195134_d_skin1_E', 'skin1')
NAME = sys.argv[1] if len(sys.argv) > 1 else 'fixable902_s2_261004003838_d_base_E.tar.gz'
TOP = 'base'
LINKS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'restore-links.txt')
OUT = os.path.join(ROOT, '_deploy', NAME)
os.makedirs(os.path.dirname(OUT), exist_ok=True)

links = [l.rstrip('\n').split('\t') for l in open(LINKS, encoding='utf-8') if l.strip()]
link_paths = {p for p, _ in links}
now = time.time()

def dir_info(rel):
    i = tarfile.TarInfo(TOP + ('/' + rel if rel else '')); i.type = tarfile.DIRTYPE; i.mode = 0o755; i.mtime = now
    return i

files, dirs = [], {''}
for d, _, fs in os.walk(SKIN):
    for f in sorted(fs):
        rel = os.path.relpath(os.path.join(d, f), SKIN).replace(os.sep, '/')
        if rel in link_paths: continue
        files.append(rel)
for rel in files + list(link_paths):
    parts = rel.split('/')[:-1]
    for k in range(1, len(parts) + 1): dirs.add('/'.join(parts[:k]))

with tarfile.open(OUT, 'w:gz', format=tarfile.GNU_FORMAT) as t:
    for rel in sorted(dirs): t.addfile(dir_info(rel))
    for rel in files:
        data = open(os.path.join(SKIN, rel), 'rb').read()
        i = tarfile.TarInfo(TOP + '/' + rel); i.size = len(data); i.mode = 0o644; i.mtime = now
        t.addfile(i, io.BytesIO(data))
    for rel, target in links:
        i = tarfile.TarInfo(TOP + '/' + rel); i.type = tarfile.SYMTYPE; i.linkname = target; i.mode = 0o777; i.mtime = now
        t.addfile(i)
print('%s : 파일 %d · 링크 %d · 폴더 %d · %.2fMB' % (os.path.relpath(OUT, ROOT), len(files), len(links), len(dirs), os.path.getsize(OUT) / 1048576))
