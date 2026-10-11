# 后端接线与验证交接

公开接口：`src/lib/sync/types.ts`；工厂`createAccountProgressController({knownIds,dataVersion})`。knownIds必须为136个Dungeon ID，Tower不可进入。

- `getSnapshot`在无变化时保留引用，`subscribe`只通知重读；配合useSyncExternalStore。start/dispose可重复，不建立第二sender。
- identity存在使用账号Set；ready=false和expired禁止写。首次失败可retry重读；只有曾成功加载的同UID可信缓存可离线编辑。
- `setComplete`和`applyTransfer`的Promise完成仅代表IndexedDB提交，云状态看snapshot。失败reject并带安全的AccountError，不显示无条件成功toast。
- 当前真实错误code包括unconfigured/invalidPublicKey/invalidCloudUrl、invalidEmail/invalidOtp/oauthFailed/authBusy/authFailed/sessionExpired/rateLimited、accountNotReady/networkFailure/permissionDenied/invalidCloudResponse、storageUnavailable/corruptCache、pendingOperations/transferBusy/invalidTransferSource/noChanges/previewExpired/sourceChanged/backupMissing/conflictMissing。UI统一三语映射或保留通用操作失败提示，不展示原始令牌或服务错误正文。
- TransferPreview.hasChanges为`{merge:boolean,replace:boolean}`；无差异模式不发云写。backup可在确认前供导出，只有apply才同事务持久备份与136项immutable batch；原guest键不修改。guest source.raw不变检查在实际浏览器执行。
- apply前UID/epoch、pending/conflicts与真实136行revision重查；源或云变化重做预览。冲突逐座选择local/cloud，普通编辑只清该座；136迁移冲突整批零写，全部冲突解决后新请求重新CAS整批。
- backups只读当前UID/project的envelope，previewRestore恢复其accountCompletedIds；仍先预览、备份、CAS。下载需使用makeBackup生成v1格式，不能把混合元数据对象当v1。
- auth listener只捕获并setTimeout调度，避免在Supabase认证锁内await；退出local scope，只在成功后返回guest，失败保留账号与队列。

私有实现：envelope单事务持有rows、loaded、overlay、immutable jobs、conflicts、backups、serial和租约；未提交不报本机成功。sender使用固定UID/epoch；旧响应至多回写旧UID持久数据，不能影响新身份。广播仅触发重读，没有BroadcastChannel仍可通过focus/online/retry恢复。租约30秒、请求超时15秒；CAS+receipt作为重复发送兜底。

自测命令：`node supabase/tests/rpc.test.mjs`、`node supabase/tests/controller.test.mjs`、`node supabase/tests/adapters.test.mjs`。前者是真实PGlite Postgres+auth.uid测试stub，分别测试执行权限、RLS过滤、RPC内部UID；后者为fake-indexeddb+受控RPC，不是实云。独立QA另写tests/v020，不能将本角色自测代替验收。


E09补充：`resolveConflict`遇展示后远端变化会保留冲突并reject `conflict_changed`。UI必须根据更新的remote重置旧radio，让用户重选；local/cloud都一样。不能把此reject提示成已解决，不能自动再次调用旧choice。
