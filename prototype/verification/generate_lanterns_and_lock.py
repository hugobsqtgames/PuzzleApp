import random, itertools, json
random.seed(7)
# ---------- AKARI 6x6 ----------
N=6
def akari_solutions(grid, limit=2):
    # grid: list of strings; '.' white, 'X' wall unnumbered, '0'-'4' numbered wall
    cells=[(r,c) for r in range(N) for c in range(N) if grid[r][c]=='.']
    def seen(r,c):
        out=[]
        for dr,dc in((1,0),(-1,0),(0,1),(0,-1)):
            rr,cc=r+dr,c+dc
            while 0<=rr<N and 0<=cc<N and grid[rr][cc]=='.':
                out.append((rr,cc)); rr+=dr; cc+=dc
        return out
    S={p:seen(*p) for p in cells}
    walls=[(r,c,int(grid[r][c])) for r in range(N) for c in range(N) if grid[r][c] in '01234']
    def nb(r,c): return [(r+dr,c+dc) for dr,dc in((1,0),(-1,0),(0,1),(0,-1)) if 0<=r+dr<N and 0<=c+dc<N]
    sols=[]
    def ok_partial(L, idx):
        # walls: count lamps <= n and (lamps + undecided neighbours) >= n
        decided=set(cells[:idx])
        for r,c,n in walls:
            k=sum(1 for p in nb(r,c) if p in L)
            u=sum(1 for p in nb(r,c) if p in S and p not in decided)
            if k>n or k+u<n: return False
        return True
    def rec(i,L):
        if len(sols)>=limit: return
        if not ok_partial(L,i): return
        if i==len(cells):
            lit=set(L)
            for p in L: lit.update(S[p])
            if all(p in lit for p in cells): sols.append(sorted(L))
            return
        p=cells[i]
        # place lamp if not seeing another lamp
        if not any(q in L for q in S[p]):
            L.add(p); rec(i+1,L); L.discard(p)
        # no lamp: prune if p can no longer be lit: any lamp sees it or some later cell can
        rec(i+1,L)
    rec(0,set())
    return sols
best=None
for attempt in range(3000):
    g=[['.']*N for _ in range(N)]
    k=random.randint(7,9)
    pos=random.sample(range(N*N//2+ (N*N)%2),k)
    for p in pos:
        r,c=divmod(p,N); g[r][c]='X'; g[N-1-r][N-1-c]='X'
    grid=[''.join(row) for row in g]
    sols=akari_solutions(grid,1)
    if not sols: continue
    sol=set(map(tuple,sols[0]))
    # number all walls
    gg=[list(row) for row in grid]
    for r in range(N):
        for c in range(N):
            if gg[r][c]=='X':
                gg[r][c]=str(sum(1 for dr,dc in((1,0),(-1,0),(0,1),(0,-1)) if (r+dr,c+dc) in sol))
    grid=[''.join(row) for row in gg]
    if len(akari_solutions(grid,2))!=1: continue
    # remove numbers greedily
    ws=[(r,c) for r in range(N) for c in range(N) if grid[r][c] in '01234']
    random.shuffle(ws)
    for r,c in ws:
        t=[list(row) for row in grid]; t[r][c]='X'; t=[''.join(x) for x in t]
        if len(akari_solutions(t,2))==1: grid=t
    nums=sum(ch in '01234' for row in grid for ch in row)
    lamps=len(sol)
    if 2<=nums<=4 and lamps>=6:
        best=(grid,sorted(sol)); break
print('AKARI',best)
json.dump({'grid':best[0],'solution':best[1]},open('/dev/null','w'))
# ---------- CADENAS 3 digits ----------
def score(code,g):
    wp=sum(a==b for a,b in zip(code,g)); common=len(set(code)&set(g)); return wp,common-wp
codes=[''.join(p) for p in itertools.permutations('0123456789',3)]
random.seed(11)
while True:
    code=random.choice(codes)
    cand=codes[:]; clues=[]
    pool=codes[:]; random.shuffle(pool)
    for g in pool:
        s=score(code,g)
        if s==(0,0) and any(c[1]==(0,0) for c in clues): continue
        if sum(s)==0 and len(clues)<3: pass
        new=[c for c in cand if score(c,g)==s]
        if len(new)<len(cand):
            clues.append((g,s)); cand=new
        if len(cand)==1: break
    if len(clues)==5:
        # minimise
        for cl in clues[:]:
            rest=[c for c in clues if c!=cl]
            if sum(1 for c in codes if all(score(c,g)==s for g,s in rest))==1: clues=rest
        if len(clues)==5 and sum(1 for c in clues if c[1]==(0,0))<=1:
            break
print('CODE',code,clues, sum(1 for c in codes if all(score(c,g)==s for g,s in clues)))
json.dump({'code':code,'clues':clues},open('/dev/null','w'))
