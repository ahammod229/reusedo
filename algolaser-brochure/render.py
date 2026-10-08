from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
    pg=b.new_page(); pg.goto('file:///home/user/reusedo/algolaser-brochure/brochure.html')
    pg.pdf(path='AlgoLaser-MK2-Brochure.pdf',format='A4',print_background=True,prefer_css_page_size=True)
    b.close()
