# 错误归一化独立复验

日期：2026-10-11。仅使用合成错误对象，未调用真实 Supabase、邮件、GitHub、JWT 或 HTTP 服务。未修改实现。

## 结果

| 实际输入 | 修前实际 detail.code | 修后实际 detail.code | 复验 |
| --- | --- | --- | --- |
| auth / 403 / otp_expired | permissionDenied | invalidOtp | 修后通过 |
| auth / 403 / validation_failed | permissionDenied | invalidOtp | 修后通过 |
| auth / 403 / otp_disabled | permissionDenied | invalidOtp | 修后通过 |
| auth / 503、TypeError、status 0、Failed to fetch | networkFailure | networkFailure | 通过；retryable=true |
| auth / 429、over_request_rate_limit、over_email_send_rate_limit | rateLimited | rateLimited | 通过；retryable=true |
| sync / 403+42501、无 code 的403、独立42501 | permissionDenied | permissionDenied | 通过 |
| sync / 403+otp_expired | permissionDenied | permissionDenied | 通过；没有将同步权限错误归为验证码 |
| 401、PGRST301、refresh_token_not_found、refresh_token_already_used | sessionExpired | sessionExpired | 通过 |
| 普通auth/sync错误、storage错误、已有AccountFailure | 按原分类 | 按原分类 | 通过 |

共27项：修前24通过、3失败；修后27通过、0失败。每项的输入、期望、实际完整detail及失败原因见JSON。

## 来源与哈希

- 修前不是重建的旧源码：使用QA父代理在修复前生成的既有真实 `.runtime/qa-v020/engine.mjs`，完整复制后仅追加导出，以调用其已有normalizeError。原始构建产物SHA256：`b94745bffc211de10756024ea732792e9443ab7a6157cf1ff66769bc622ab5d4`。无法由该产物推得原始TS哈希，JSON中明确为null。
- 修后读取实际 `src/lib/cloud/errors.ts`，用esbuild编译；源码SHA256：`7a34720ad47874cdcb10a6262c735c267329534db454c1543fbe9da6072bb3b3`。与后端提供的冻结值一致。
- `sourceHash`分别指上述实际输入文件，`compiledHash`指本次可执行产物，不混用两者。

## 文件与执行

- 脚本：`tests/v020/qa_errors.mjs`。
- 修前结果：`error-normalization-before.json`；保留产物：`error-normalization-before-bundle.mjs`。
- 修后结果：`error-normalization-after.json`；源码快照：`error-normalization-after-source.ts`；编译产物：`error-normalization-after-bundle.mjs`。
- 实际执行：`node tests/v020/qa_errors.mjs before`退出1；`node tests/v020/qa_errors.mjs after`退出0。
- 旧的`.runtime`路径可能被后续构建覆盖；本次修前证据以已保存产物和哈希为准，不能拿后续重新生成的文件替代。

浏览器修前独立证据由父代理保留于 `browser-otp-403-before-fix.json` 和 `otp-403-expired-before-fix.png`。本次仅补错误函数矩阵，不替代DOM复验或真实云验证。

发布收尾注：上述原始before-bundle文件保留在本机；Git中发布同名.mjs.gz无损归档，可用gzip -dk还原，原payload SHA与压缩SHA见release/legacy-bundle-archive.json。编译器行尾空格不改变、历史证据不覆盖；该产物不进入网站构建。
