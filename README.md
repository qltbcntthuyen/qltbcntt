# QLTBCNTT  

---

## Kiến trúc tổng thể

Mô hình dự án tổ chức theo cấu trúc như sau:

```text
QLTBCNTT/
│
├── apps/
│   ├── api/                   # Backend: NestJS (Chạy port: 1005)
│   └── web/                   # Frontend: Next.js (Chạy port: 5001)
│
├── packages/
│   ├── shared/                # Dùng chung: Types & DTOs cho cả FE & BE (Khuyến nghị để schema Supabase tại đây)
│   ├── ui/                    # Dùng chung: React UI components
│   ├── eslint-config/         # Cấu hình ESLint tiêu chuẩn
│   └── typescript-config/     # Cấu hình TypeScript tiêu chuẩn
│
├── pnpm-workspace.yaml        # Phân mảnh Workspace
└── turbo.json                 # Cấu hình Pipelines của Turborepo
```

---

## Cài đặt & Khởi chạy

### Yêu cầu hệ thống (Prerequisites)
- **Node.js:** `>= 20` (Khuyến nghị: 24.12.0)
- **pnpm:** `>= 10` (Khuyến nghị: 10.26.2)

### Clone & Cài đặt dependencies
Chạy lệnh sau **tại thư mục gốc của monorepo** để thiết lập cài đặt toàn cục:

```bash
pnpm install
```

### Khởi chạy Development
Lệnh sau sẽ kích hoạt **Turborepo**, tự động build các package dùng chung trước, sau đó chạy song song cả Backend và Frontend:

```bash
pnpm dev
```
- **Frontend App:** [http://localhost:5001](http://localhost:5001)
- **Backend API:** [http://localhost:1005](http://localhost:1005)

---

## Quản lý Package với pnpm Workspaces

**LƯU Ý:** Tại Monorepo **không dùng `npm install` hoặc `pnpm add` trực tiếp** vào thư mục root nếu không chỉ định filter đích. Luôn dùng cờ `--filter`.

### Cài đặt thư viện mới

| Mục tiêu | Lệnh | Ví dụ |
| :--- | :--- | :--- |
| **Backend** | `pnpm add <lib> --filter api` | `pnpm add mssql --filter api` |
| **Frontend** | `pnpm add <lib> --filter web` | `pnpm add axios --filter web` |
| **Shared** | `pnpm add <lib> --filter @repo/shared` | `pnpm add zod --filter @repo/shared` |
| **Root (Tools)** | `pnpm add -D <lib> -w` | `pnpm add -D typescript -w` |

---

## Các Quy Ước (Conventions) Code

Dự án áp dụng chặt chẽ cho **Next.js (FE)** và **NestJS + Supabase (BE)**:

### 1. Shared Package Convention (`packages/shared`)
Gói này được sử dụng làm **"Từ điển chung"** giữa Backend và Frontend. Tại đây chỉ chứa **pure TypeScript** (chèn Enum, Inteface, TypeDB từ Supabase, và các payload Validation DTO).
- **Tuyệt đối không** import code của framework vào đây (như `@nestjs/*` hoặc `react`).
- Khi BE/FE cần dùng chung kiểu (như DB model), chỉ việc import thẳng `import { CreateUserDto } from '@repo/shared'`.

### 2. Định tuyến API & Mapping Flow
Luồng đi của dữ liệu yêu cầu:
1. **Next.js (Client)** gửi request.
2. Dữ liệu chạy qua **Shared DTO** để biết cần trả cái gì / Client push gì.
3. **NestJS** (Controller -> Service -> Supabase ORM layer).

### 3. Quy chuẩn đặt tên (Naming)

| Loại Nội dung | Quy ước | Ví dụ minh họa |
| :--- | :--- | :--- |
| **Folder / Tệp `.ts`** | `kebab-case` | `user-profile` / `user.service.ts` |
| **Entity / DTO Model** | `camelCase` / `kebab` | `user.entity.ts` / `create-user.dto.ts` |
| **Class / Component React**| `PascalCase` | `UserService` / `UserProfileCard` |
| **Constant (Hằng số)** | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT` |

---

## Git Branching & Commit Convention

Git của dự án tuân thủ tiêu chuẩn cao để theo dõi tiến độ công việc và Tích hợp CI/CD tự động:

### Nhánh làm việc (Branches):
- `main`: Chứa code production cấp cao nhất.
- `develop`: Nhánh chính để làm việc trực tiếp, merge các feature.
- `feature/*`: Phát triển tính năng (vd: `feature/auth-login-api`).
- `bugfix/*` hoặc `hotfix/*`: Trị bug hoặc hotfix khẩn cấp.

### Quy tắt Commit Message:
Áp dụng **Conventional Commits**:
`<Loại>: <Mô tả ngắn gọn> (#<Issue ID>)`

**Loại Commit (Type):**
- `feat`: Phát triển tính năng mới.
- `fix`: Sửa lỗi, fix bug.
- `docs`: Cập nhật liên quan đến Markdown, tài liệu.
- `style`: Sửa đổi formatting code.
- `refactor`: Dọn dẹp/Sửa cấu trúc code mà không thay đổi bản chất logic.

Ví dụ: `feat: tích hợp API đăng nhập với Supabase (#12)`

---

## Testing, Build & Troubleshooting

### Build Production
Lệnh Turborepo build song song siêu tốc cho toàn bộ dự án (chạy từ thư mục gốc):
```bash
pnpm build
```

### Xử lý rác hệ thống (Troubleshooting)
Khi Cache bị đứng, Code lưu không ăn, Lỗi Turbo lệch Sync, bạn nên tiến hành Clear Cache Monorepo gốc:

```bash
# Xóa thư mục bộ đệm và module
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf apps/*/dist
rm -rf apps/*/.next
rm -rf packages/*/dist
```
Sau đó lấy lại:
```bash
pnpm install
pnpm dev
```
