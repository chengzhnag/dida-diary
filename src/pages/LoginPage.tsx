import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, ArrowRight, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAppStore(s => s.login);
  const navigate = useNavigate();
  useEffect(() => {
    if (password) setError(false);
  }, [password]);
  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    try {
      const success = await login(password);
      if (success) {
        toast.success('欢迎回到滴答日记');
        navigate('/', { replace: true });
      } else {
        setError(true);
        toast.error('管理密码错误');
        setTimeout(() => setError(false), 500);
      }
    } catch (err) {
      toast.error('连接服务器失败');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#FFF7ED] flex flex-col items-center justify-center p-6 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm space-y-10 text-center relative z-10"
      >
        <div className="space-y-4">
          <div className="mx-auto w-20 h-20 bg-orange-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-orange-500/20">
            <BookOpen className="text-white w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">滴答日记</h1>
            <p className="text-zinc-500 text-sm italic">记录每一个值得铭记的瞬间</p>
          </div>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <motion.div animate={error ? { x: [-8, 8, -8, 8, 0] } : {}}>
            <Input
              type="password"
              placeholder="请输入管理密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(
                "h-16 text-center text-xl bg-white rounded-3xl border-orange-100 focus:ring-orange-500 shadow-sm transition-all",
                error && "border-red-300 ring-red-100"
              )}
              autoFocus
              disabled={loading}
            />
          </motion.div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-16 bg-orange-500 hover:bg-orange-600 rounded-3xl text-xl font-bold shadow-lg shadow-orange-500/30 group active:scale-[0.98] transition-all"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                开启滴答之旅
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            )}
          </Button>
          <p className="text-[10px] text-zinc-400 font-medium">默认管理密码: admin</p>
        </form>
      </motion.div>
      <footer className="absolute bottom-10 flex flex-col items-center gap-1">
        <span className="text-zinc-300 text-[10px] uppercase tracking-[0.2em] font-bold">
          滴答日记 · 滴答记录你的心跳
        </span>
        <span className="text-zinc-200 text-[9px]">守护每一份纯粹的时光</span>
      </footer>
    </div>
  );
}