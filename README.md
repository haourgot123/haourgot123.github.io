# haourgot123 — Blog công nghệ

Blog dùng **Astro + Starlight + Starlight Blog**, với giao diện terminal lấy cảm hứng từ Crawl4AI: nền đen, link cyan, font JetBrains Mono toàn trang, thanh điều hướng trên cùng và hai sidebar. Nội dung viết bằng Markdown/MDX; tìm kiếm, tags, RSS, tô màu code và nút sao chép đã có sẵn.

Quy trình đăng bài: **tạo file → viết nội dung → xem trước → bỏ trạng thái nháp → kiểm tra → commit và push lên `main`**. GitHub Actions sẽ cập nhật web sau khi deploy thành công.

Hướng dẫn này dùng terminal tại thư mục gốc của repo, nơi có `package.json`. Các tên như `ten-bai-viet.md` và `ten-anh.png` bên dưới là đường dẫn để thay bằng tên file của bạn; chúng không tạo bài viết trên site.

## Chạy trên máy

Cần Node.js 24 (phiên bản trong `.nvmrc`) và npm. Nếu dùng nvm, chọn đúng phiên bản bằng:

```bash
nvm install
nvm use
```

Cài dependencies khi mới clone repo hoặc khi `package-lock.json` thay đổi:

```bash
npm ci
```

Khởi động trang xem trước:

```bash
npm run dev
```

Mở địa chỉ in trong terminal, mặc định **http://localhost:4321**. Dừng bằng `Ctrl+C`.

```bash
npm run check   # Kiểm tra Astro và TypeScript
npm run build   # Build trang tĩnh vào dist/
npm run preview # Xem bản build, bao gồm tìm kiếm Pagefind
```

Tìm kiếm dùng Pagefind, được tạo khi build. Kiểm tra chức năng tìm kiếm bằng `npm run build` rồi `npm run preview`.

## Tạo và viết bài

### 1. Tạo file từ template

Copy [template](templates/post.md) vào thư mục bài viết:

```bash
cp -n templates/post.md src/content/docs/blog/ten-bai-viet.md
```

Đặt tên file bằng chữ thường không dấu, dùng `-` để ngăn cách các từ. `cp -n` sẽ không ghi đè nếu file đã tồn tại.

Tên file quyết định URL: `src/content/docs/blog/ten-bai-viet.md` sẽ có địa chỉ `/blog/ten-bai-viet/`. Giữ tên file ổn định sau khi đăng để tránh làm hỏng link cũ.

### 2. Sửa thông tin đầu bài

Mở file vừa tạo. Phần nằm giữa hai dòng `---` đầu tiên là **frontmatter**, chứa thông tin của bài:

| Trường | Cách điền |
| --- | --- |
| `title` | Tiêu đề thật của bài viết. |
| `date` | Ngày đăng theo dạng `YYYY-MM-DD`; đổi ngày có sẵn trong template. |
| `description` | Mô tả ngắn cho công cụ tìm kiếm và thông tin chia sẻ trang. |
| `excerpt` | Đoạn tóm tắt dùng trong danh sách bài của blog. |
| `authors` | Giữ `haourgot123`; ID này được cấu hình là Nguyễn Nguyên Hảo. |
| `tags` | Danh sách chủ đề của bài. Có thể giữ `[]` nếu chưa gắn tag. |
| `draft` | Giữ `true` khi đang viết; đổi thành `false` khi muốn xuất bản. |

Nếu tiêu đề hoặc mô tả chứa dấu `:`, nên đặt toàn bộ giá trị trong dấu nháy kép để YAML đọc đúng. Các tag có khoảng trắng cũng có thể đặt trong dấu nháy kép, chẳng hạn `"AI Agent"`.

**Ngày đăng chỉ dùng để sắp xếp bài, không phải lịch hẹn xuất bản.** Một bài có ngày tương lai vẫn có thể xuất hiện khi `draft: false`.

### 3. Viết nội dung bên dưới frontmatter

Xóa các dòng hướng dẫn trong template và thay bằng nội dung của bạn. Không cần thêm heading `#`: Starlight đã hiển thị tiêu đề chính từ `title`.

| Nội dung | Cú pháp Markdown |
| --- | --- |
| Đề mục | `## Tên đề mục` |
| Mục con | `### Tên mục con` |
| In đậm | `**nội dung**` |
| Code trong câu | Dùng một dấu backtick ở mỗi đầu đoạn code. |
| Danh sách | Bắt đầu mỗi dòng bằng `- ` |
| Link | `[nội dung hiển thị](đường-dẫn)` |

Với code nhiều dòng, dùng ba dấu backtick và ghi tên ngôn ngữ sau dấu mở. Cấu trúc:

````text
```python
# Thay bằng code của bạn
```
````

Blog sẽ tự tô màu cú pháp và thêm nút sao chép. Đề mục `##` và `###` tự tạo mục lục của bài.

Dùng `.md` cho Markdown thông thường. Nếu cần import component như Tabs, dùng đuôi `.mdx`.

### 4. Thêm ảnh nếu có

Tạo thư mục chứa ảnh:

```bash
mkdir -p public/images
```

Chép ảnh thật của bài vào thư mục đó. Chèn ảnh bằng cú pháp:

```markdown
![Mô tả nội dung ảnh](/images/ten-anh.png)
```

Thay `ten-anh.png` bằng đúng tên file, kể cả chữ hoa/chữ thường. Đường dẫn trên web bắt đầu từ `/images/`, không có `public/`.

### 5. Xem trước và kiểm tra

```bash
npm run dev
```

Mở `/blog/ten-bai-viet/` trên địa chỉ localhost được in trong terminal. Mỗi lần lưu file, trang sẽ cập nhật. Kiểm tra nội dung, ảnh, link và khối code.

**Bản nháp hiện trong `npm run dev`, nhưng bị loại khỏi bản build để xuất bản, tìm kiếm và RSS.** Khi viết xong, đổi thành `draft: false` rồi chạy:

```bash
npm run check
npm run build
npm run preview
```

Mở URL mà `preview` in ra để xem đúng bản sẽ được đưa lên web và thử tìm kiếm. Nếu còn một tiến trình dev chiếm cổng, dùng URL mới được in ra hoặc dừng dev bằng `Ctrl+C` trước.

### 6. Đăng bài lên web

Lần đầu, hoàn thành phần [thiết lập GitHub Pages](#thiết-lập-github-pages-lần-đầu) bên dưới trước khi đăng.

Workflow deploy khi có commit mới trên `main`. Kiểm tra nhánh hiện tại:

```bash
git branch --show-current
```

Nếu đang làm trực tiếp trên `main`, lưu và đẩy bài bằng:

```bash
git status --short
git add src/content/docs/blog/ten-bai-viet.md
git diff --cached
git commit -m "Publish blog post"
git push origin main
```

Đổi đường dẫn thành file bài thực tế. Nếu bài có ảnh mới, chạy thêm `git add public/images/ten-anh.png` với từng ảnh cần đăng trước khi commit. `git diff --cached` giúp đọc lại nội dung sắp được đưa vào commit.

Nếu làm trên nhánh riêng, tạo pull request vào `main`; merge sau khi bước kiểm tra thành công. Push nhánh riêng chưa làm thay đổi web.

Sau khi push hoặc merge, mở tab **Actions → Build and deploy blog** của repo. Đợi job `deploy` thành công rồi kiểm tra bài tại **https://haourgot123.github.io/blog/ten-bai-viet/**.

Danh sách bài trên trang chủ, tags, RSS và tìm kiếm được tạo lại tự động. Không cần thêm bài vào sidebar, sửa danh sách bài bằng tay hoặc commit thư mục `dist/`.

## Sửa hoặc gỡ bài đã đăng

- **Sửa nội dung:** chỉnh file bài, kiểm tra rồi commit và push như khi đăng bài mới.
- **Gỡ tạm thời:** đổi thành `draft: true`, sau đó build và push. Bài vẫn có trong repo nhưng được loại khỏi web khi deploy xong.
- **Xóa hẳn:** xóa file bài, commit và push. Link cũ sẽ không còn trang để mở.

Đổi tên file cũng làm đổi URL, nên hạn chế đổi tên sau khi đã chia sẻ link.

## Tùy chỉnh

| Nội dung | File |
| --- | --- |
| Tên blog, URL, GitHub và tác giả | `astro.config.mjs` |
| Các link điều hướng ở header và sidebar | `src/lib/navigation.ts` |
| Trang chủ | `src/content/docs/index.mdx` |
| Trang giới thiệu | `src/content/docs/gioi-thieu.md` |
| Màu sắc và font | `src/styles/custom.css` |
| Nhãn tiếng Việt của plugin blog | `src/content/i18n/vi.json` |
| Mẫu bài viết | `templates/post.md` |

Tên hiện tại là **haourgot123** theo tài khoản GitHub, có thể đổi tại `title` trong `astro.config.mjs`. Theme tối là mặc định cho lần truy cập đầu; lựa chọn sáng/tối/tự động của người đọc được ghi nhớ.

Danh sách bài mới trên trang chủ và danh sách chủ đề tự cập nhật từ bài đã xuất bản. Plugin tạo các trang tags, tác giả, danh sách bài có phân trang và RSS tại `/blog/rss.xml`.

Ảnh tĩnh đặt trong `public/images/` và tham chiếu bằng đường dẫn như `![Mô tả ảnh](/images/anh.png)`. Không đưa mật khẩu hoặc token vào bài viết hay repo.

## Thiết lập GitHub Pages lần đầu

Workflow `.github/workflows/deploy.yml` cài dependencies bằng `npm ci`, kiểm tra kiểu và build:

- Pull request vào `main`: kiểm tra và build.
- Push vào `main` hoặc chạy workflow thủ công: kiểm tra, build và deploy.

Chỉ cần thực hiện một lần cho repo:

1. Mở **Settings → Pages** của repo.
2. Ở **Build and deployment → Source**, chọn **GitHub Actions**.
3. Commit và push **toàn bộ phần setup blog**, gồm source, cấu hình, workflow, `package.json` và `package-lock.json`. Lần đầu chỉ push một file bài viết là chưa đủ để dựng site.

Sau khi `npm run check` và `npm run build` chạy thành công, có thể dùng:

```bash
git status --short
git add .
git diff --cached
git commit -m "Set up personal blog"
git push -u origin main
```

Đọc lại các file đã stage trước khi commit. `.gitignore` đã loại `node_modules/`, `dist/`, `.astro/` và các file kiểm tra cục bộ.

4. Mở tab **Actions**, đợi workflow **Build and deploy blog** và job `deploy` thành công.

Sau khi deploy thành công, site sẽ ở **https://haourgot123.github.io/**. Không cần nhánh `gh-pages` hoặc token riêng. Nếu đổi domain, cập nhật `site` trong `astro.config.mjs`, URL sitemap trong `public/robots.txt` và cấu hình GitHub Pages.

## Khi bài chưa xuất hiện

| Hiện tượng | Kiểm tra |
| --- | --- |
| Thấy bài ở localhost nhưng không có trên web | Bài đã đổi `draft: false` chưa? Commit đã lên `main` và job `deploy` đã thành công chưa? |
| Không thấy bài ngay cả khi chạy dev | File phải nằm trong `src/content/docs/blog/`, có đuôi `.md` hoặc `.mdx`; kiểm tra lỗi trong terminal. |
| Build báo lỗi | Kiểm tra frontmatter YAML và thông báo lỗi đầu tiên; không push tiếp trước khi sửa được lỗi. |
| Tìm kiếm không chạy trong dev | Dùng `npm run build` rồi `npm run preview`; Pagefind được tạo trong bước build. |
| Ảnh không hiện | Kiểm tra tên file, chữ hoa/chữ thường, đường dẫn `/images/...` và ảnh đã được commit chưa. |
| Push xong nhưng web vẫn cũ | Xem đúng workflow của commit vừa push trong tab Actions; nếu deploy thành công, tải lại trang và kiểm tra URL. |

## Cấu trúc

```text
src/
  components/           # Danh sách bài, chủ đề, theme mặc định
  content/docs/
    index.mdx           # Trang chủ
    gioi-thieu.md       # Giới thiệu
    chu-de.mdx          # Danh sách tags
    blog/               # Bài viết Markdown/MDX
  content/i18n/vi.json   # Nhãn tiếng Việt
  content.config.ts     # Schema của nội dung
  styles/custom.css     # Giao diện
public/                 # Tài nguyên tĩnh
astro.config.mjs        # Cấu hình Starlight và plugin blog
templates/post.md       # Mẫu bài viết
```
