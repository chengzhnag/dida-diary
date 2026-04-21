import React from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Download,
  Upload,
  LogOut,
  Palette,
  Sun,
  Moon
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/hooks/use-theme';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
interface SettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export function SettingsDrawer({ open, onOpenChange }: SettingsDrawerProps) {
  const importDiaries = useAppStore(s => s.importDiaries);
  const getAllExportDiaries = useAppStore(s => s.getAllExportDiaries);
  const logout = useAppStore(s => s.logout);
  const { isDark, toggleTheme } = useTheme();

  const handleExport = async () => {
    try {
      const diaries = await getAllExportDiaries();
      if (!diaries || diaries.length === 0) {
        toast.error('备份失败：无有效日记数据');
        return;
      }
      const data = JSON.stringify(diaries, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      if (blob.size < 10) { // 根据实际数据量调整阈值
        toast.error('备份失败：生成文件内容异常');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dida-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (navigator.permissions && !navigator.permissions.query) {
        toast.warning('浏览器可能阻止自动下载，请手动确认');
      } else {
        toast.success('已触发下载操作，请检查下载目录');
      }
    } catch (error) {
      toast.error('备份出错了：' + error.message);
    }
  };
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const items = JSON.parse(event.target?.result as string);
        if (Array.isArray(items)) {
          await importDiaries(items);
          toast.success(`成功找回 ${items.length} 段时光碎片`);
          onOpenChange(false);
        } else {
          toast.error('备份文件格式似乎不对');
        }
      } catch (err) {
        toast.error('无法解析该时光文件');
      }
    };
    reader.readAsText(file);
  };
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] bg-background border-none rounded-t-[2.5rem]">
        <DrawerHeader className="border-b border-zinc-50 dark:border-zinc-800 pt-8">
          <DrawerTitle className="text-center text-xl font-bold text-foreground">设置中心</DrawerTitle>
          <DrawerDescription className="text-center text-xs text-muted-foreground">
            管理您的时光安全、数据备份与外观配置
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-6 space-y-8 overflow-y-auto hide-scrollbar">
          {/* 外观管理 */}
          {/* <section className="space-y-4">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 px-2">
              <Palette size={12} className="text-orange-400" /> 个性化外观
            </h3>
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-3xl border border-border">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold">显示模式</span>
                <span className="text-[10px] text-muted-foreground">在浅橙纸张与静谧深色间切换</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleTheme}
                className="bg-background rounded-2xl border border-border shadow-sm px-4 gap-2 h-10 active:scale-95 transition-all"
              >
                {isDark ? (
                  <><Moon size={16} className="text-orange-400" /> 静谧深色</>
                ) : (
                  <><Sun size={16} className="text-orange-500" /> 治愈浅橙</>
                )}
              </Button>
            </div>
          </section> */}
          {/* 数据管理 */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 px-2">
              <Download size={12} className="text-blue-400" /> 数据实验室
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleExport}
                className="flex flex-col items-center gap-3 p-5 bg-orange-50/50 dark:bg-orange-500/10 rounded-3xl active:scale-95 transition-all border border-orange-100/30 hover:bg-orange-100/20"
              >
                <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center text-orange-500 shadow-sm border border-orange-50/50">
                  <Download size={20} />
                </div>
                <span className="text-xs font-bold text-orange-700 dark:text-orange-300">导出备份</span>
              </button>
              <label className="flex flex-col items-center gap-3 p-5 bg-blue-50/50 dark:bg-blue-500/10 rounded-3xl active:scale-95 transition-all cursor-pointer border border-blue-100/30 hover:bg-blue-100/20">
                <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center text-blue-500 shadow-sm border border-blue-50/50">
                  <Upload size={20} />
                </div>
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300">导入恢复</span>
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </div>
          </section>
          {/* 安全提示 */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 px-2">
              <Shield size={12} className="text-zinc-400" /> 安全与隐私
            </h3>
            <div className="p-4 bg-secondary/30 rounded-3xl border border-dashed border-border">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                管理密码与访问密码现已通过环境变量锁定。如需更改，请通过平台部署配置进行更新。
              </p>
            </div>
          </section>
          {/* 账户操作 */}
          <section className="pt-6">
            <Button
              variant="ghost"
              onClick={() => { logout(); onOpenChange(false); }}
              className="w-full h-14 rounded-3xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 gap-2 font-bold transition-colors"
            >
              <LogOut size={18} /> 退出当前登录
            </Button>
          </section>
        </div>
        <DrawerFooter className="text-center pb-10">
          <p className="text-[10px] text-muted-foreground font-medium tracking-tight">滴答日记 v1.0.0 · 守护每一份纯粹</p>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}