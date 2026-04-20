import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
export default function VerifyPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const unlockList = useAppStore(s => s.unlockList);
  const isListUnlocked = useAppStore(s => s.isListUnlocked);

  useEffect(() => {
    if (isListUnlocked) {
      navigate('/diaries', { replace: true });
    }
  }, [isListUnlocked, navigate]);

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    try {
      const success = await unlockList(password);
      if (success) {
        toast.success('时光之门已开启');
        navigate('/diaries');
      } else {
        setError(true);
        toast.error('访问密码错误');
        setTimeout(() => setError(false), 500);
      }
    } catch (err) {
      toast.error('验证失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF7ED] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-orange-100 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-orange-200 rounded-full blur-3xl opacity-30" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-12 text-center relative z-10"
      >
        <div className="space-y-4">
          <div className="mx-auto w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center text-orange-500 shadow-2xl shadow-orange-500/10 border border-orange-50">
            <Lock size={40} strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">时光锁</h1>
            <p className="text-zinc-500 text-sm italic">这段记忆已被封存，请输入密码开启</p>
          </div>
        </div>
        <form onSubmit={handleVerify} className="space-y-6">
          <motion.div animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}>
            <Input
              type="password"
              placeholder="请输入 4 位访问密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-16 text-center text-2xl bg-white rounded-3xl border-orange-100 focus:ring-orange-500 shadow-sm font-mono tracking-widest"
              autoFocus
              disabled={loading}
            />
          </motion.div>
          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-orange-500 hover:bg-orange-600 rounded-2xl text-lg font-bold shadow-lg shadow-orange-500/30 group"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  解锁时光 <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/')}
              className="h-12 rounded-2xl text-zinc-400 hover:text-zinc-600 font-medium flex items-center gap-2"
            >
              <ArrowLeft size={16} /> 回到记录
            </Button>
          </div>
        </form>
      </motion.div>
      <footer className="absolute bottom-10 text-[10px] text-zinc-300 font-medium tracking-tight">
        滴答日记 · 隐私加密受保护
      </footer>
    </div>
  );
}