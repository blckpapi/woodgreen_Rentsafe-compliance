'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
/* oxlint-disable nextjs/no-img-element -- Keep source-owned photos at their original URLs without an image proxy. */
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  FileText,
  LayoutDashboard,
  Leaf,
  LockKeyhole,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { band } from '@/lib/city';
import { resources } from '@/lib/resources';
import { CITY_BASE, evaluationUrl, orderUrl } from '@/lib/portfolio';
import type { Building, Change, Snapshot } from '@/lib/portfolio';
type View =
  | 'Overview'
  | 'Properties'
  | 'Monitoring'
  | 'Resources'
  | 'Data coverage';
const nav = [
  { name: 'Overview', icon: LayoutDashboard },
  { name: 'Properties', icon: Building2 },
  { name: 'Monitoring', icon: Activity },
  { name: 'Resources', icon: BookOpen },
  { name: 'Data coverage', icon: Database },
] as const;
const date = (value: string | null, withTime = false) => {
  if (!value) return 'Unavailable';
  const parsed = new Date(value.length === 10 ? value + 'T12:00:00Z' : value);
  return Number.isFinite(parsed.getTime())
    ? new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Toronto',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
      }).format(parsed)
    : value;
};
const priority = (b: Building) =>
  (b.orders?.filter((o) => o.primary).length ?? 0) * 100 +
  (b.score !== null && b.score < 85 ? 90 - b.score : 0);
function LinkOut({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="source-link"
    >
      {children}
      <ArrowUpRight size={15} />
    </a>
  );
}
function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            className="icon-button"
            aria-label={label}
            onClick={onClick}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
function Status({ building }: { building: Building }) {
  const label = building.rsn
    ? band(building.score)
    : building.matchAddress
      ? 'Unmatched'
      : 'Confidential';
  return (
    <span className={'status ' + label.toLowerCase()}>
      <i />
      {label}
    </span>
  );
}
function NavContent({
  view,
  setView,
}: {
  view: View;
  setView: (v: View) => void;
}) {
  const { setOpenMobile } = useSidebar();
  return (
    <>
      <SidebarHeader className="brand">
        <ShieldCheck size={28} />
        <span>
          RentSafe<small>COMPLIANCE</small>
        </span>
      </SidebarHeader>
      <SidebarContent>
        <div className="workspace-label">PORTFOLIO WORKSPACE</div>
        <div className="workspace-name">
          <span className="woodgreen-mark">W</span>
          <span>
            WoodGreen<small>Community Services</small>
          </span>
        </div>
        <nav aria-label="Main navigation">
          {nav.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={'nav-item ' + (view === name ? 'active' : '')}
              onClick={() => {
                setView(name);
                setOpenMobile(false);
              }}
              aria-current={view === name ? 'page' : undefined}
            >
              <Icon size={18} />
              {name}
              {view === name && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <div className="workspace-label">OFFICIAL RESOURCES</div>
        <a
          className="nav-item"
          href={CITY_BASE + 'audits-evaluations/rentsafeto-map/'}
          target="_blank"
          rel="noreferrer"
        >
          <MapPin size={18} />
          City building map
          <ArrowUpRight size={14} />
        </a>
        <a
          className="nav-item"
          href="https://www.woodgreen.org/services/housing"
          target="_blank"
          rel="noreferrer"
        >
          <Building2 size={18} />
          WoodGreen housing
          <ArrowUpRight size={14} />
        </a>
      </SidebarContent>
      <SidebarFooter className="sidebar-foot">
        <div>
          <LockKeyhole size={16} />
          Private presentation
        </div>
        <p>
          Prepared for WoodGreen
          <br />
          by RentSafe Compliance
        </p>
      </SidebarFooter>
    </>
  );
}
function PropertyTable({
  buildings,
  onSelect,
}: {
  buildings: Building[];
  onSelect: (b: Building) => void;
}) {
  return (
    <Table className="property-table">
      <TableHeader>
        <TableRow>
          <TableHead>Property</TableHead>
          <TableHead>City units</TableHead>
          <TableHead>Score / 100</TableHead>
          <TableHead>Band</TableHead>
          <TableHead>Listed items</TableHead>
          <TableHead>
            <span className="sr-only">Details</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {buildings.map((b) => (
          <TableRow key={b.id}>
            <TableCell>
              <button className="property-name" onClick={() => onSelect(b)}>
                {b.matchAddress ? b.address : b.name}
                <span>
                  {b.matchAddress ? b.name : 'Address withheld by WoodGreen'}
                </span>
              </button>
            </TableCell>
            <TableCell>{b.units ?? 'Unavailable'}</TableCell>
            <TableCell>
              <span className="score-number">{b.score ?? 'Unavailable'}</span>
              {b.score !== null && (
                <span className="score-track">
                  <span
                    style={{ width: b.score + '%' }}
                    className={band(b.score).toLowerCase()}
                  />
                </span>
              )}
            </TableCell>
            <TableCell>
              <Status building={b} />
            </TableCell>
            <TableCell>
              {b.orders === null ? (
                <span className="muted">Not monitored</span>
              ) : b.orders.length > 0 ? (
                <span className="order-count">
                  <TriangleAlert size={14} />
                  {b.orders.length} listed
                </span>
              ) : (
                <span className="muted">None listed</span>
              )}
            </TableCell>
            <TableCell>
              <IconButton label={'View ' + b.name} onClick={() => onSelect(b)}>
                <ChevronRight size={18} />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
export default function Dashboard({ initial }: { initial: Snapshot }) {
  const [snapshot, setSnapshot] = useState(initial),
    [changes, setChanges] = useState<Change[]>([]),
    [view, setView] = useState<View>('Overview'),
    [selected, setSelected] = useState<Building | null>(null),
    [query, setQuery] = useState(''),
    [filter, setFilter] = useState('All properties'),
    [resourceCategory, setResourceCategory] = useState('All resources'),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [connection, setConnection] = useState(false),
    [clockNow, setClockNow] = useState(0),
    [lastAttempt, setLastAttempt] = useState<string | null>(null);
  const load = useCallback(async (refresh = false) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/monitor', {
        method: refresh ? 'POST' : 'GET',
      });
      const data = (await response.json()) as {
        snapshot: Snapshot;
        changes: Change[];
        lastAttempt?: string;
        warning?: string;
        error?: string;
      };
      if (!response.ok)
        throw new Error(data.error ?? 'Monitoring service unavailable.');
      setSnapshot(data.snapshot);
      setSelected((current) =>
        current
          ? (data.snapshot.buildings.find((b) => b.id === current.id) ?? null)
          : null,
      );
      setChanges(data.changes);
      setConnection(true);
      setLastAttempt(data.lastAttempt ?? null);
      if (data.warning) setError(data.warning);
      if (refresh && !data.warning)
        setMessage(
          'City sources checked. ' +
            data.changes.filter((c: Change) => !c.reviewed).length +
            ' unreviewed changes.',
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection unavailable.');
      setConnection(false);
    } finally {
      setBusy(false);
      setClockNow(Date.now());
    }
  }, []);
  useEffect(() => {
    const initialCheck = setTimeout(() => void load(), 0);
    const timer = setInterval(
      () => {
        if (document.visibilityState === 'visible') void load();
      },
      15 * 60 * 1000,
    );
    return () => {
      clearTimeout(initialCheck);
      clearInterval(timer);
    };
  }, [load]);
  useEffect(() => {
    const readRoute = () => {
      const hash = window.location.hash.slice(1);
      const found = nav.find(
        (n) => n.name.toLowerCase().replace(' ', '-') === hash,
      );
      if (found) setView(found.name);
    };
    const initialRoute = setTimeout(readRoute, 0);
    window.addEventListener('hashchange', readRoute);
    return () => {
      clearTimeout(initialRoute);
      window.removeEventListener('hashchange', readRoute);
    };
  }, []);
  const navigate = (v: View) => {
    setView(v);
    setQuery('');
    setFilter('All properties');
    window.history.replaceState(
      null,
      '',
      '#' + v.toLowerCase().replace(' ', '-'),
    );
  };
  const buildings = snapshot.buildings,
    matched = buildings.filter((b) => b.rsn),
    scored = matched.filter((b) => b.score !== null),
    green = scored.filter((b) => band(b.score) === 'Green'),
    attention = matched.filter((b) => priority(b) > 0),
    listed = matched.reduce((n, b) => n + (b.orders?.length ?? 0), 0),
    publicLocations = buildings.filter((b) => b.matchAddress),
    unmatched = publicLocations.filter((b) => !b.rsn),
    confidential = buildings.filter((b) => !b.matchAddress),
    unreviewed = changes.filter((c) => !c.reviewed),
    stale = clockNow - new Date(snapshot.checkedAt).getTime() > 30 * 3600000;
  const ordered = useMemo(
    () =>
      [...buildings].sort(
        (a, b) =>
          priority(b) - priority(a) || a.address.localeCompare(b.address),
      ),
    [buildings],
  );
  const visible = ordered.filter(
    (b) =>
      (b.address + ' ' + b.name + ' ' + b.service + ' ' + (b.rsn ?? ''))
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === 'All properties' ||
        (filter === 'Needs review' && attention.some((a) => a.id === b.id)) ||
        (filter === 'Matched' && b.rsn) ||
        (filter === 'Unmatched' && b.matchAddress && !b.rsn) ||
        (filter === 'Confidential' && !b.matchAddress) ||
        band(b.score) === filter),
  );
  const exportCsv = () => {
    const quote = (v: string | number | null | undefined) =>
      '"' + String(v ?? 'Unavailable').replace(/"/g, '""') + '"';
    const rows = [
      [
        'Property',
        'Program',
        'Service',
        'City RSN',
        'City units',
        'WoodGreen program units',
        'Current score',
        'Score band',
        'Evaluated',
        'Listed items',
        'Checked at',
        'Portfolio source',
        'City evaluation source',
      ],
      ...visible.map((b) => [
        b.address,
        b.name,
        b.service,
        b.rsn,
        b.units,
        b.providerUnits,
        b.score,
        b.rsn ? band(b.score) : 'Not monitored',
        b.evaluated,
        b.orders?.length,
        snapshot.checkedAt,
        b.source,
        b.rsn ? evaluationUrl(b.rsn) : null,
      ]),
    ];
    const blob = new Blob(
      ['\uFEFF' + rows.map((r) => r.map(quote).join(',')).join('\r\n')],
      { type: 'text/csv;charset=utf-8;' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download =
      'woodgreen-portfolio-' + snapshot.checkedAt.slice(0, 10) + '.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const review = async (change: Change) => {
    try {
      const response = await fetch('/api/monitor', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: change.id, reviewed: !change.reviewed }),
      });
      if (!response.ok) throw new Error('Review could not be saved.');
      setChanges((old) =>
        old.map((c) =>
          c.id === change.id ? { ...c, reviewed: change.reviewed ? 0 : 1 } : c,
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const select = (b: Building) => setSelected(b);
  const changesList = (limit = 100) => (
    <div className="change-list">
      {changes.length === 0 ? (
        <div className="empty-state">
          <Activity size={28} />
          <strong>Baseline established</strong>
          <p>No changes have been recorded since the first verified check.</p>
          <span>Monitoring began {date(initial.checkedAt, true)}</span>
        </div>
      ) : (
        changes.slice(0, limit).map((c) => {
          const b = buildings.find((b) => b.id === c.buildingId);
          return (
            <div className="change-row" key={c.id}>
              <span className="event-icon">
                <Activity size={17} />
              </span>
              <div>
                <button className="text-button" onClick={() => b && select(b)}>
                  {b?.address ?? 'Portfolio'}
                </button>
                <p>{c.message}</p>
                <small>{date(c.observedAt, true)} ET</small>
              </div>
              <IconButton
                label={c.reviewed ? 'Mark unreviewed' : 'Mark reviewed'}
                onClick={() => void review(c)}
              >
                {c.reviewed ? <CheckCircle2 size={20} /> : <Check size={20} />}
              </IconButton>
            </div>
          );
        })
      )}
    </div>
  );
  return (
    <TooltipProvider>
      <SidebarProvider
        style={{ '--sidebar-width': '244px' } as React.CSSProperties}
      >
        <Sidebar>
          <NavContent view={view} setView={navigate} />
        </Sidebar>
        <main className="workspace">
          <header className="topbar">
            <div className="breadcrumbs">
              <SidebarTrigger />
              <span>WoodGreen portfolio</span>
              <ChevronRight size={14} />
              <strong>{view}</strong>
            </div>
            <div className="topbar-right">
              <span className="presentation-tag">PRESENTATION WORKSPACE</span>
              <span className="avatar">RC</span>
            </div>
          </header>
          <div className="page-content">
            <div className="page-heading">
              <div>
                <div className="eyebrow">HOUSING OPERATIONS / TORONTO</div>
                <h1>
                  {view === 'Overview' ? 'WoodGreen Community Services' : view}
                </h1>
                <p>
                  {view === 'Overview'
                    ? 'Portfolio compliance overview'
                    : view === 'Properties'
                      ? 'Published locations and matched City records'
                      : view === 'Monitoring'
                        ? 'Source checks and recorded changes'
                        : view === 'Resources'
                          ? 'Official guidance, forms and portfolio references'
                          : 'Portfolio scope, matching and source provenance'}
                </p>
              </div>
              <div className="heading-actions">
                <IconButton label="Export portfolio CSV" onClick={exportCsv}>
                  <ArrowDownToLine size={19} />
                </IconButton>
                <IconButton
                  label="Print presentation"
                  onClick={() => window.print()}
                >
                  <FileText size={19} />
                </IconButton>
                <Button
                  className="refresh-button"
                  onClick={() => void load(true)}
                  disabled={busy}
                >
                  <RefreshCw size={16} className={busy ? 'spinning' : ''} />
                  {busy ? 'Checking sources' : 'Check sources'}
                </Button>
              </div>
            </div>
            <div className={'data-strip ' + (stale ? 'stale' : '')}>
              <span>
                <span className={'live-dot ' + (stale ? 'amber' : '')} />
                {stale ? 'Snapshot needs refresh' : 'Verified City snapshot'}
              </span>
              <span>Checked {date(snapshot.checkedAt, true)} ET</span>
              <button onClick={() => navigate('Data coverage')}>
                {matched.length} matched buildings
                <ArrowUpRight size={14} />
              </button>
            </div>
            {error && (
              <div role="alert" className="feedback error">
                <TriangleAlert size={17} />
                <span>{error} Last successful snapshot remains visible.</span>
              </div>
            )}
            {message && (
              <output className="feedback success">
                <CheckCircle2 size={17} />
                {message}
              </output>
            )}
            {view === 'Overview' && (
              <>
                <section className="metrics" aria-label="Portfolio summary">
                  <div>
                    <span>
                      Matched buildings
                      <Building2 size={19} />
                    </span>
                    <strong>
                      {matched.length}
                      <small>/ {publicLocations.length}</small>
                    </strong>
                    <p>Public addresses in this workspace</p>
                  </div>
                  <div>
                    <span>
                      Green band
                      <ShieldCheck size={19} />
                    </span>
                    <strong className="green-text">
                      {green.length}
                      <small>/ {scored.length} scored</small>
                    </strong>
                    <p>City score of 85 or higher</p>
                  </div>
                  <div>
                    <span>
                      Properties to review
                      <TriangleAlert size={19} />
                    </span>
                    <strong className="amber-text">{attention.length}</strong>
                    <p>Below 85 or a Property Standards Order</p>
                  </div>
                  <div>
                    <span>
                      Listed orders / notices
                      <FileText size={19} />
                    </span>
                    <strong>{listed}</strong>
                    <p>
                      Across{' '}
                      {
                        matched.filter((b) => (b.orders?.length ?? 0) > 0)
                          .length
                      }{' '}
                      matched buildings
                    </p>
                  </div>
                </section>
                <div className="overview-grid">
                  <section className="section-main">
                    <div className="section-title">
                      <div>
                        <h2>Priority review</h2>
                        <p>Current public-record signals</p>
                      </div>
                      <button
                        className="text-link"
                        onClick={() => {
                          navigate('Properties');
                          setFilter('Needs review');
                        }}
                      >
                        View properties
                        <ArrowRight size={16} />
                      </button>
                    </div>
                    <PropertyTable
                      buildings={ordered.filter((b) =>
                        attention.some((a) => a.id === b.id),
                      )}
                      onSelect={select}
                    />
                  </section>
                  <section className="score-section">
                    <div className="section-title">
                      <div>
                        <h2>Score distribution</h2>
                        <p>{scored.length} published scores</p>
                      </div>
                    </div>
                    <figure
                      className="distribution-chart"
                      style={{ margin: 0 }}
                      aria-label={['Green', 'Yellow', 'Red']
                        .map(
                          (t) =>
                            `${scored.filter((b) => band(b.score) === t).length} ${t}`,
                        )
                        .join(', ')}
                    >
                      {['Green', 'Yellow', 'Red'].map((t) => {
                        const count = scored.filter(
                          (b) => band(b.score) === t,
                        ).length;
                        if (count === 0) return null;
                        return (
                          <div
                            key={t}
                            className={
                              'distribution-segment ' + t.toLowerCase()
                            }
                            style={{ flex: count }}
                          >
                            {count > 0 ? count : ''}
                          </div>
                        );
                      })}
                    </figure>
                    <div className="band-legend">
                      {[
                        ['Green', '85 - 100'],
                        ['Yellow', '70 - 84'],
                        ['Red', '0 - 69'],
                      ].map(([label, range]) => (
                        <button
                          key={label}
                          onClick={() => {
                            navigate('Properties');
                            setFilter(label);
                          }}
                        >
                          <span>
                            <i className={label.toLowerCase()} />
                            {label}
                            <small>{range}</small>
                          </span>
                          <strong>
                            {
                              scored.filter((b) => band(b.score) === label)
                                .length
                            }
                          </strong>
                        </button>
                      ))}
                    </div>
                    <p className="fine-print">
                      Bands calculated from City scores. Posted signs have not
                      been inspected.
                    </p>
                    <LinkOut
                      href={CITY_BASE + 'rentsafeto-colour-coded-signs/'}
                    >
                      City band definitions
                    </LinkOut>
                  </section>
                </div>
                <section className="portfolio-photos">
                  <div className="section-title">
                    <div>
                      <h2>Across the portfolio</h2>
                      <p>WoodGreen housing locations</p>
                    </div>
                    <button
                      className="text-link"
                      onClick={() => navigate('Properties')}
                    >
                      All locations
                      <ArrowRight size={16} />
                    </button>
                  </div>
                  <div className="photo-grid">
                    {buildings
                      .filter(
                        (b): b is typeof b & { image: string } =>
                          typeof b.image === 'string',
                      )
                      .map((b) => (
                        <button
                          className="photo-property"
                          onClick={() => select(b)}
                          key={b.id}
                        >
                          <img
                            width={1425}
                            height={392}
                            src={b.image}
                            alt={'Exterior of ' + b.address}
                            loading="lazy"
                          />
                          <div>
                            <span>
                              <strong>{b.address}</strong>
                              <small>{b.name}</small>
                            </span>
                            <Status building={b} />
                          </div>
                        </button>
                      ))}
                  </div>
                </section>
                <div className="bottom-grid">
                  <section>
                    <div className="section-title">
                      <div>
                        <h2>Monitoring activity</h2>
                        <p>Changes recorded after the baseline</p>
                      </div>
                      <button
                        className="text-link"
                        onClick={() => navigate('Monitoring')}
                      >
                        Activity log
                        <ArrowRight size={16} />
                      </button>
                    </div>
                    {changesList(3)}
                  </section>
                  <section className="coverage-summary">
                    <div className="section-title">
                      <div>
                        <h2>Coverage to reconcile</h2>
                        <p>Outside the matched building set</p>
                      </div>
                    </div>
                    <button onClick={() => navigate('Data coverage')}>
                      <span className="coverage-number">
                        {unmatched.length}
                      </span>
                      <span>
                        Public addresses unmatched
                        <small>
                          Registration or address confirmation needed
                        </small>
                      </span>
                      <ArrowRight size={17} />
                    </button>
                    <button onClick={() => navigate('Data coverage')}>
                      <span className="coverage-number neutral">
                        {confidential.length}
                      </span>
                      <span>
                        Confidential program locations
                        <small>Street-level information only</small>
                      </span>
                      <ArrowRight size={17} />
                    </button>
                  </section>
                </div>
              </>
            )}
            {view === 'Properties' && (
              <section>
                <div className="filter-bar">
                  <div className="search-field">
                    <Search size={17} />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search property, program or City ID"
                      aria-label="Search properties"
                    />
                  </div>
                  <Select
                    value={filter}
                    onValueChange={(v) => setFilter(String(v))}
                  >
                    <SelectTrigger aria-label="Filter properties">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        'All properties',
                        'Needs review',
                        'Green',
                        'Yellow',
                        'Red',
                        'Matched',
                        'Unmatched',
                        'Confidential',
                      ].map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="result-count">
                    {visible.length} locations
                  </span>
                </div>
                {visible.length ? (
                  <PropertyTable buildings={visible} onSelect={select} />
                ) : (
                  <div className="empty-state">
                    <Search size={25} />
                    <strong>No matching properties</strong>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setQuery('');
                        setFilter('All properties');
                      }}
                    >
                      Clear filters
                    </Button>
                  </div>
                )}
              </section>
            )}
            {view === 'Monitoring' && (
              <>
                <section className="monitor-summary">
                  <div>
                    <Activity size={23} />
                    <h2>Portfolio monitor</h2>
                    <p>
                      Scheduled City checks every 6 hours, with an on-demand
                      check available above.
                    </p>
                    <LinkOut href="https://github.com/blckpapi/woodgreen_Rentsafe-compliance/actions/workflows/monitor.yml">
                      Scheduled run history
                    </LinkOut>
                  </div>
                  <dl>
                    <div>
                      <dt>Last successful check</dt>
                      <dd>{date(snapshot.checkedAt, true)} ET</dd>
                    </div>
                    <div>
                      <dt>Order layer updated</dt>
                      <dd>{date(snapshot.sourceUpdatedAt, true)} ET</dd>
                    </div>
                    <div>
                      <dt>Dashboard storage</dt>
                      <dd>
                        {connection
                          ? 'Connected'
                          : 'Connecting / snapshot mode'}
                      </dd>
                    </div>
                    <div>
                      <dt>Changes awaiting review</dt>
                      <dd>{unreviewed.length}</dd>
                    </div>
                  </dl>
                </section>
                <div className="section-title">
                  <div>
                    <h2>Change log</h2>
                    <p>Score, band, reactive score and listed order changes</p>
                  </div>
                  <span className="count-label">{changes.length} recorded</span>
                </div>
                {changesList()}
                <div className="monitor-notes">
                  <Clock3 size={20} />
                  <p>
                    Scheduled checks run independently of this page. The
                    dashboard checks for updated results every 15 minutes while
                    open. City publication times can lag conditions on site. A
                    removed order is recorded as no longer listed, not as
                    confirmed closed.{' '}
                    {lastAttempt && (
                      <>Last attempt: {date(lastAttempt, true)} ET.</>
                    )}
                  </p>
                </div>
              </>
            )}
            {view === 'Resources' && (
              <>
                <div className="filter-bar">
                  <div className="search-field">
                    <Search size={17} />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      aria-label="Search resources"
                      placeholder="Search guidance, forms or sources"
                    />
                  </div>
                  <Select
                    value={resourceCategory}
                    onValueChange={(v) => setResourceCategory(String(v))}
                  >
                    <SelectTrigger aria-label="Resource category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        'All resources',
                        'City requirements',
                        'Forms & templates',
                        'Source records',
                        'WoodGreen',
                      ].map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="resource-grid">
                  {resources
                    .filter(
                      (r) =>
                        (resourceCategory === 'All resources' ||
                          r.category === resourceCategory) &&
                        (r.title + ' ' + r.description)
                          .toLowerCase()
                          .includes(query.toLowerCase()),
                    )
                    .map((r) => (
                      <a
                        className="resource-item"
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        key={r.title}
                      >
                        <span
                          className={
                            'resource-icon ' +
                            (r.publisher === 'WoodGreen' ? 'woodgreen' : 'city')
                          }
                        >
                          {r.publisher === 'WoodGreen' ? (
                            <Leaf size={22} />
                          ) : (
                            <FileText size={22} />
                          )}
                        </span>
                        <span className="resource-category">{r.category}</span>
                        <h2>
                          {r.title}
                          <ArrowUpRight size={18} />
                        </h2>
                        <p>{r.description}</p>
                        <small>{r.publisher}</small>
                      </a>
                    ))}
                </div>
                <p className="fine-print">
                  Resource selection checked September 7, 2026. Follow the
                  source for current requirements and revised forms.
                </p>
              </>
            )}
            {view === 'Data coverage' && (
              <>
                <section className="scope-intro">
                  <div>
                    <h2>Publicly documented portfolio scope</h2>
                    <p>
                      This workspace contains {buildings.length} selected public
                      program and property listings. It is a presentation subset
                      of WoodGreen&apos;s wider portfolio, which includes whole
                      buildings, partnered operations and units within other
                      properties.
                    </p>
                    <LinkOut href="https://www.woodgreen.org/property-management-properties-we-manage">
                      WoodGreen&apos;s published management scope
                    </LinkOut>
                  </div>
                  <div>
                    <strong>
                      {matched.length}{' '}
                      <small>of {publicLocations.length}</small>
                    </strong>
                    <p>
                      Public addresses matched to a unique City registration
                    </p>
                    <Progress
                      value={(matched.length / publicLocations.length) * 100}
                      aria-label="Public address match coverage"
                    />
                  </div>
                </section>
                <div className="section-title">
                  <div>
                    <h2>Matching register</h2>
                    <p>Exact normalized addresses; no inferred ownership</p>
                  </div>
                </div>
                <Table className="property-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property / program</TableHead>
                      <TableHead>City record</TableHead>
                      <TableHead>WoodGreen units</TableHead>
                      <TableHead>City units</TableHead>
                      <TableHead>Evidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buildings.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <button
                            className="property-name"
                            onClick={() => select(b)}
                          >
                            {b.matchAddress ? b.address : b.name}
                            <span>{b.scopeNote ?? b.service}</span>
                          </button>
                        </TableCell>
                        <TableCell>
                          {b.rsn ??
                            (b.matchAddress ? 'No unique match' : 'Withheld')}
                        </TableCell>
                        <TableCell>
                          {b.providerUnits ?? 'Unavailable'}
                        </TableCell>
                        <TableCell>
                          {b.units ?? 'Unavailable'}
                          {b.providerUnits !== null &&
                            b.units !== null &&
                            b.providerUnits !== b.units && (
                              <span className="reconcile">
                                Different counts
                              </span>
                            )}
                        </TableCell>
                        <TableCell>
                          <LinkOut href={b.source}>Source</LinkOut>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <section className="methodology">
                  <h2>Reading this data</h2>
                  <div>
                    <article>
                      <h3>Coverage</h3>
                      <p>
                        Unmatched does not mean exempt or compliant.
                        Confidential program addresses are not reconstructed.
                        WoodGreen must confirm the complete operating portfolio,
                        address aliases and responsibility for partnered sites.
                      </p>
                    </article>
                    <article>
                      <h3>Unit counts</h3>
                      <p>
                        City counts refer to registered buildings. WoodGreen
                        counts can refer to a program or property group. They
                        are shown separately and are not combined into a
                        portfolio total.
                      </p>
                    </article>
                    <article>
                      <h3>Source timing</h3>
                      <p>
                        The check time records retrieval, not an inspection.
                        Category ratings belong to the listed evaluation date.
                        Source failures retain the last successful snapshot and
                        produce a visible warning.
                      </p>
                    </article>
                    <article>
                      <h3>Operator review</h3>
                      <p>
                        Review flags identify a score below 85 or a listed
                        Property Standards Order. They are prioritization rules,
                        not additional City findings. Reviewed changes remain in
                        the activity log.
                      </p>
                    </article>
                  </div>
                </section>
              </>
            )}
            <footer className="page-footer">
              <span>
                RentSafe Compliance / Prepared for WoodGreen Community Services
              </span>
              <span>Independent presentation · Public records only</span>
            </footer>
          </div>
        </main>
        <Sheet
          open={!!selected}
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        >
          <SheetContent className="building-sheet">
            {selected && (
              <>
                <SheetHeader>
                  <div className="eyebrow">PROPERTY RECORD</div>
                  <SheetTitle>
                    {selected.matchAddress ? selected.address : selected.name}
                  </SheetTitle>
                  <SheetDescription>
                    {selected.name} · {selected.service}
                  </SheetDescription>
                </SheetHeader>
                {selected.image && (
                  <figure className="detail-image">
                    <img
                      width={1425}
                      height={392}
                      src={selected.image}
                      alt={'Exterior of ' + selected.address}
                    />
                    <figcaption>Photo: WoodGreen Community Services</figcaption>
                  </figure>
                )}
                <div className="detail-summary">
                  <div>
                    <span>Current score</span>
                    <strong>
                      {selected.score ?? 'Unavailable'}
                      {selected.score !== null && <small>/100</small>}
                    </strong>
                    <Status building={selected} />
                  </div>
                  <dl>
                    <div>
                      <dt>City units</dt>
                      <dd>{selected.units ?? 'Unavailable'}</dd>
                    </div>
                    <div>
                      <dt>WoodGreen program units</dt>
                      <dd>{selected.providerUnits ?? 'Unavailable'}</dd>
                    </div>
                    <div>
                      <dt>City evaluation</dt>
                      <dd>{date(selected.evaluated)}</dd>
                    </div>
                    <div>
                      <dt>Reactive score</dt>
                      <dd>{selected.reactive ?? 'Unavailable'}</dd>
                    </div>
                  </dl>
                </div>
                {selected.scopeNote && (
                  <p className="scope-note">{selected.scopeNote}</p>
                )}
                <Tabs defaultValue="records" className="detail-tabs">
                  <TabsList variant="line">
                    <TabsTrigger value="records">Orders & notices</TabsTrigger>
                    <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
                    <TabsTrigger value="sources">Sources</TabsTrigger>
                  </TabsList>
                  <TabsContent value="records">
                    <h3>Listed City items</h3>
                    <p className="muted">
                      Snapshot checked {date(snapshot.checkedAt, true)} ET
                    </p>
                    {selected.orders === null ? (
                      <div className="empty-state">
                        <Database size={24} />
                        <strong>No matched City registration</strong>
                        <p>
                          Order coverage has not been established for this
                          location.
                        </p>
                      </div>
                    ) : selected.orders.length === 0 ? (
                      <div className="empty-state">
                        <CheckCircle2 size={26} />
                        <strong>No items listed at this check</strong>
                        <p>
                          This is a source observation, not a compliance
                          clearance.
                        </p>
                      </div>
                    ) : (
                      selected.orders.map((o) => (
                        <article className="order-item" key={o.id}>
                          <div>
                            <span className="order-count">
                              <TriangleAlert size={15} />
                              {o.primary ? 'Property Standards Order' : o.bylaw}
                            </span>
                            <strong>{o.id}</strong>
                          </div>
                          <dl>
                            <div>
                              <dt>Record type</dt>
                              <dd>{o.type}</dd>
                            </div>
                            <div>
                              <dt>Opened</dt>
                              <dd>{date(o.opened)}</dd>
                            </div>
                            <div>
                              <dt>Deficiencies</dt>
                              <dd>{o.deficiencies ?? 'Unavailable'}</dd>
                            </div>
                            <div>
                              <dt>Confirmed deadline</dt>
                              <dd>Unavailable in this feed</dd>
                            </div>
                          </dl>
                          <p>
                            Listed in the City&apos;s active layer. Verify the
                            actual notice or order for its deadline and required
                            work.
                          </p>
                        </article>
                      ))
                    )}
                  </TabsContent>
                  <TabsContent value="evaluation">
                    <h3>Published evaluation history</h3>
                    <div className="evaluation-history">
                      {selected.history.length ? (
                        selected.history.map((h) => (
                          <div key={h.date}>
                            <span>{date(h.date)}</span>
                            <strong>
                              {h.score ?? 'Unavailable'}
                              <small> / 100</small>
                            </strong>
                          </div>
                        ))
                      ) : (
                        <p className="muted">
                          No published evaluation matched.
                        </p>
                      )}
                    </div>
                    <h3>Category ratings</h3>
                    <p className="muted">
                      City ratings from {date(selected.evaluated)}. 1 is lowest;
                      3 is highest. Unassessed categories are excluded.
                    </p>
                    <div className="category-list">
                      {[...selected.categories]
                        .sort((a, b) => a.rating - b.rating)
                        .map((c) => (
                          <div key={c.name}>
                            <span>{c.name.toLowerCase()}</span>
                            <strong className={'rating rating-' + c.rating}>
                              {c.rating}
                              <small>/3</small>
                            </strong>
                          </div>
                        ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="sources">
                    <div className="detail-sources">
                      <LinkOut href={selected.source}>
                        WoodGreen portfolio source
                      </LinkOut>
                      {selected.rsn && (
                        <>
                          <LinkOut href={evaluationUrl(selected.rsn)}>
                            City evaluation records · {selected.rsn}
                          </LinkOut>
                          <LinkOut href={orderUrl(selected.rsn)}>
                            City orders and notices · {selected.rsn}
                          </LinkOut>
                        </>
                      )}
                      <LinkOut
                        href={CITY_BASE + 'audits-evaluations/rentsafeto-map/'}
                      >
                        Official RentSafeTO map
                      </LinkOut>
                    </div>
                    <dl className="record-facts">
                      <div>
                        <dt>City address</dt>
                        <dd>{selected.cityAddress ?? 'No unique match'}</dd>
                      </div>
                      <div>
                        <dt>Management on registration</dt>
                        <dd>{selected.management ?? 'Unavailable'}</dd>
                      </div>
                      <div>
                        <dt>Ward</dt>
                        <dd>{selected.ward ?? 'Unavailable'}</dd>
                      </div>
                      <div>
                        <dt>Storeys</dt>
                        <dd>{selected.storeys ?? 'Unavailable'}</dd>
                      </div>
                    </dl>
                    {selected.lat && selected.lng && (
                      <>
                        <h3>Building location</h3>
                        <iframe
                          className="location-map"
                          title="Building location map"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          src={
                            'https://www.openstreetmap.org/export/embed.html?' +
                            new URLSearchParams({
                              bbox: [
                                selected.lng - 0.006,
                                selected.lat - 0.003,
                                selected.lng + 0.006,
                                selected.lat + 0.003,
                              ].join(','),
                              layer: 'mapnik',
                              marker: [selected.lat, selected.lng].join(','),
                            })
                          }
                        />
                        <LinkOut
                          href={
                            'https://www.openstreetmap.org/?mlat=' +
                            selected.lat +
                            '&mlon=' +
                            selected.lng +
                            '#map=17/' +
                            selected.lat +
                            '/' +
                            selected.lng
                          }
                        >
                          Open location map
                        </LinkOut>
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              </>
            )}
          </SheetContent>
        </Sheet>
      </SidebarProvider>
    </TooltipProvider>
  );
}
