from pathlib import Path
from bs4 import BeautifulSoup
from urllib.parse import urlsplit,unquote
import json
BASE=Path(__file__).resolve().parent.parent;dist=BASE/'dist';issues=[];count=0;links=0
for file in dist.rglob('*.html'):
 s=BeautifulSoup(file.read_text(encoding='utf-8'),'html.parser');count+=1
 assert s.title and s.select_one('meta[name=description]'),str(file)
 for tag,attr in [('a','href'),('img','src'),('script','src'),('link','href')]:
  for e in s.select(f'{tag}[{attr}]'):
   url=e.get(attr);p=urlsplit(url)
   if p.scheme or p.netloc or not p.path.startswith('/'):continue
   path=dist/unquote(p.path).lstrip('/');links+=1
   if path.is_dir():path=path/'index.html'
   if not path.exists():issues.append((str(file.relative_to(dist)),url))
 for im in s.select('img'):
  assert im.has_attr('alt'),str(file)
assert not issues,issues
print(json.dumps({'html_pages':count,'local_links_and_assets_checked':links,'broken':issues}))
