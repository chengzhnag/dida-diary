import React, { useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { LogOut, ShieldCheck, Download, Upload, Heart, Key, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
export function SettingsPage() {
  const logout = useAppStore(s => s.logout);
  const diaries = useAppStore(useShallow(s => s.diaries));
  const updateSettings = useAppStore(s => s.updateSettings);
  const importDiaries = useAppStore(s => s.importDiaries);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [passDialogOpen, setPassDialogOpen] = useState(false);
  const [newPass, setNewPass] = useState('');
  const handleExport = () => {
    if (diaries.length === 0) {
      toast.info('目前还没有任何时光碎片可供导出');
      return;
    }
    const dataStr = JSON.stringify(diaries, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `memos-whispers-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    toast.success('备份导出成功');
  };
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await importDiaries(json);
        toast.success('时光碎片已成功找回');
      } catch (err) {
        toast.error('文件格式不正确或解析失败');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };
  const handleUpdatePassword = async () => {
    if (!newPass.trim()) {
      toast.error('密码不能为空');
      return;
    }
    await updateSettings({ diaryPassword: newPass });
    setPassDialogOpen(false);
    setNewPass('');
    toast.success('访问密码已更新');
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12 space-y-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">我的时光</h1>
          <p className="text-sm text-muted-foreground">守护您的隐私与珍贵回忆</p>
        </header>
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-orange-500 uppercase tracking-widest ml-1">安全中心</h2>
          <Card className="overflow-hidden border-none shadow-soft rounded-3xl bg-white">
            <button
              onClick={() => setPassDialogOpen(true)}
              className="w-full p-5 flex items-center justify-between active:bg-orange-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-50 rounded-xl text-blue-500">
                  <Key size={20} />
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold block text-zinc-800">修改回顾访问密码</span>
                  <span className="text-xs text-muted-foreground">用于锁定整个日记列表</span>
                </div>
              </div>
              <ShieldCheck size={18} className="text-zinc-300" />
            </button>
            <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-100">
              <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                <Lock size={10} /> 修改后，回顾功能将受到新密码的保护。
              </p>
            </div>
          </Card>
        </section>
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-orange-500 uppercase tracking-widest ml-1">数据管理</h2>
          <Card className="overflow-hidden border-none shadow-soft rounded-3xl bg-white divide-y divide-zinc-50">
            <button onClick={handleExport} className="w-full p-5 flex items-center justify-between active:bg-orange-50 transition-colors text-left">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-50 rounded-xl text-green-500">
                  <Download size={20} />
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold block text-zinc-800">导出时光备份</span>
                  <span className="text-xs text-muted-foreground">将所有日记下载为 JSON 格式</span>
                </div>
              </div>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="w-full p-5 flex items-center justify-between active:bg-orange-50 transition-colors text-left">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-50 rounded-xl text-purple-500">
                  <Upload size={20} />
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold block text-zinc-800">找回时光碎片</span>
                  <span className="text-xs text-muted-foreground">从备份文件合并导入日记</span>
                </div>
              </div>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
          </Card>
        </section>
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-orange-500 uppercase tracking-widest ml-1">关于项目</h2>
          <Card className="p-5 bg-white border-none shadow-soft rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-pink-50 rounded-xl text-pink-500">
                <Heart size={20} fill="currentColor" />
              </div>
              <div className="text-left">
                <span className="text-sm font-bold block text-zinc-800">纯粹日记 (Memos & Whispers)</span>
                <span className="text-xs text-muted-foreground">Version 2.2.0 - 稳定版</span>
              </div>
            </div>
          </Card>
        </section>
        <Button
          variant="ghost"
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full h-14 bg-white text-zinc-600 hover:text-red-500 hover:bg-red-50 rounded-3xl border-none shadow-soft transition-all duration-200"
        >
          <LogOut className="mr-2" size={18} />
          退出当前登录
        </Button>
        <Dialog open={passDialogOpen} onOpenChange={setPassDialogOpen}>
          <DialogContent className="max-w-[320px] rounded-3xl">
            <DialogHeader>
              <DialogTitle>更新访问密码</DialogTitle>
              <DialogDescription id="password-dialog-desc">
                请输入新的访问密码，用于保护您的日记列表。
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="输入新密码"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                className="h-12 text-center rounded-xl bg-orange-50 border-none focus:ring-orange-500 text-lg font-bold"
                autoFocus
              />
            </div>
            <DialogFooter className="flex flex-row gap-2">
              <Button variant="ghost" onClick={() => setPassDialogOpen(false)} className="flex-1 rounded-xl">取消</Button>
              <Button onClick={handleUpdatePassword} className="flex-1 rounded-xl bg-orange-500 text-white">保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}