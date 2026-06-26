import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const NAV = [
  { id: 'dashboard', label: 'Дашборд', icon: 'LayoutDashboard' },
  { id: 'clients', label: 'Клиенты', icon: 'Users' },
  { id: 'services', label: 'Услуги и товары', icon: 'Package' },
  { id: 'staff', label: 'Сотрудники', icon: 'UserCog' },
  { id: 'orders', label: 'Заказы', icon: 'ClipboardList' },
  { id: 'landing', label: 'Лендинг', icon: 'Globe' },
  { id: 'chats', label: 'Чаты', icon: 'MessageSquare' },
  { id: 'settings', label: 'Настройки', icon: 'Settings' },
];

const STATS = [
  { label: 'Выручка за месяц', value: '₽ 842 500', change: '+12,4%', up: true, icon: 'TrendingUp' },
  { label: 'Новые заказы', value: '128', change: '+8,1%', up: true, icon: 'ShoppingBag' },
  { label: 'Активные клиенты', value: '356', change: '+3,2%', up: true, icon: 'Users' },
  { label: 'Средний чек', value: '₽ 6 580', change: '-1,7%', up: false, icon: 'Receipt' },
];

const CHART = [42, 58, 47, 65, 72, 60, 80, 68, 88, 75, 92, 84];
const MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

const ORDERS = [
  { id: '#1042', client: 'Анна Светлова', service: 'Консультация', sum: '₽ 4 500', status: 'Новый', color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  { id: '#1041', client: 'ООО «Вектор»', service: 'Разработка сайта', sum: '₽ 85 000', status: 'В работе', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  { id: '#1040', client: 'Игорь Демин', service: 'Аудит', sum: '₽ 12 000', status: 'Выполнен', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  { id: '#1039', client: 'Мария Кольцова', service: 'Поддержка', sum: '₽ 3 200', status: 'Выполнен', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
];

const ACTIVITY = [
  { icon: 'UserPlus', text: 'Новый клиент: Анна Светлова', time: '5 мин назад' },
  { icon: 'CheckCircle2', text: 'Заказ #1040 выполнен', time: '32 мин назад' },
  { icon: 'CreditCard', text: 'Оплачен счёт на ₽ 85 000', time: '1 ч назад' },
  { icon: 'MessageSquare', text: 'Новое сообщение в чате', time: '2 ч назад' },
];

export default function Index() {
  const [dark, setDark] = useState(true);
  const [active, setActive] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const activeLabel = NAV.find((n) => n.id === active)?.label ?? '';

  const Sidebar = (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Icon name="Boxes" size={22} />
        </div>
        <div>
          <p className="font-display text-lg font-semibold leading-none text-white">Glider_box</p>
          <p className="mt-1 text-xs text-sidebar-foreground/60">Бизнес-кабинет</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => { setActive(item.id); setMenuOpen(false); }}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active === item.id
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            }`}
          >
            <Icon name={item.icon} size={18} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src="" />
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">ИП</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">Иван Петров</p>
            <p className="truncate text-xs text-sidebar-foreground/60">Студия «Глайдер»</p>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:block">{Sidebar}</div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="animate-scale-in">{Sidebar}</div>
          <div className="flex-1 bg-black/50" onClick={() => setMenuOpen(false)} />
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(true)}>
              <Icon name="Menu" size={22} />
            </Button>
            <div>
              <h1 className="font-display text-xl font-semibold md:text-2xl">{activeLabel}</h1>
              <p className="hidden text-sm text-muted-foreground sm:block">Добро пожаловать, Иван</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="relative">
              <Icon name="Bell" size={18} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setDark(!dark)}>
              <Icon name={dark ? 'Sun' : 'Moon'} size={18} />
            </Button>
            <Button className="hidden gap-2 sm:flex">
              <Icon name="Plus" size={18} />
              Новый заказ
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {active === 'dashboard' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {STATS.map((s, i) => (
                  <Card
                    key={s.label}
                    className="animate-fade-in p-5 opacity-0"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                        <Icon name={s.icon} size={20} />
                      </div>
                      <span className={`flex items-center gap-1 text-xs font-semibold ${s.up ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                        <Icon name={s.up ? 'ArrowUp' : 'ArrowDown'} size={14} />
                        {s.change}
                      </span>
                    </div>
                    <p className="mt-4 font-display text-2xl font-bold tracking-tight">{s.value}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="animate-fade-in p-6 opacity-0 lg:col-span-2" style={{ animationDelay: '320ms' }}>
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-lg font-semibold">Динамика выручки</h3>
                      <p className="text-sm text-muted-foreground">За последние 12 месяцев</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Icon name="Download" size={16} />
                      Excel
                    </Button>
                  </div>
                  <div className="flex h-52 items-end justify-between gap-2">
                    {CHART.map((h, i) => (
                      <div key={i} className="flex flex-1 flex-col items-center gap-2">
                        <div
                          className="w-full rounded-t-md bg-primary/80 transition-all hover:bg-primary"
                          style={{ height: `${h}%` }}
                        />
                        <span className="text-[10px] text-muted-foreground">{MONTHS[i]}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="animate-fade-in p-6 opacity-0" style={{ animationDelay: '400ms' }}>
                  <h3 className="mb-5 font-display text-lg font-semibold">Активность</h3>
                  <div className="space-y-4">
                    {ACTIVITY.map((a, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                          <Icon name={a.icon} size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-snug">{a.text}</p>
                          <p className="text-xs text-muted-foreground">{a.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <Card className="animate-fade-in overflow-hidden opacity-0" style={{ animationDelay: '480ms' }}>
                <div className="flex items-center justify-between border-b border-border p-6">
                  <h3 className="font-display text-lg font-semibold">Последние заказы</h3>
                  <Button variant="ghost" size="sm" className="gap-1 text-primary">
                    Все заказы
                    <Icon name="ChevronRight" size={16} />
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                        <th className="px-6 py-3 font-medium">Заказ</th>
                        <th className="px-6 py-3 font-medium">Клиент</th>
                        <th className="hidden px-6 py-3 font-medium sm:table-cell">Услуга</th>
                        <th className="px-6 py-3 font-medium">Сумма</th>
                        <th className="px-6 py-3 font-medium">Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ORDERS.map((o) => (
                        <tr key={o.id} className="border-b border-border last:border-0 transition-colors hover:bg-muted/40">
                          <td className="px-6 py-4 font-medium text-primary">{o.id}</td>
                          <td className="px-6 py-4">{o.client}</td>
                          <td className="hidden px-6 py-4 text-muted-foreground sm:table-cell">{o.service}</td>
                          <td className="px-6 py-4 font-semibold">{o.sum}</td>
                          <td className="px-6 py-4">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${o.color}`}>{o.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          ) : (
            <div className="flex h-full min-h-[60vh] animate-fade-in items-center justify-center">
              <Card className="flex max-w-md flex-col items-center gap-4 p-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <Icon name={NAV.find((n) => n.id === active)?.icon ?? 'Box'} size={32} />
                </div>
                <h2 className="font-display text-2xl font-semibold">{activeLabel}</h2>
                <p className="text-muted-foreground">
                  Этот раздел готов к настройке. Напишите, что должно здесь происходить — и я соберу его под вашу задачу.
                </p>
                <Button onClick={() => setActive('dashboard')} variant="outline" className="gap-2">
                  <Icon name="ArrowLeft" size={16} />
                  Вернуться на дашборд
                </Button>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
