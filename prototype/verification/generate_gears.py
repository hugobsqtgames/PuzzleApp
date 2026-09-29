import random, json
N=4
D=[(-1,0),(0,1),(1,0),(0,-1)] # N E S W bits 1,2,4,8
def rot(m,k):
    for _ in range(k): m=((m<<1)|(m>>3))&15
    return m
def gen(seed):
    random.seed(seed)
    # random spanning tree via randomized DFS/Wilson-ish (Prim)
    conn=[[0]*N for _ in range(N)]
    start=(random.randrange(N),random.randrange(N))
    inT={start}; frontier=[]
    def addf(r,c):
        for i,(dr,dc) in enumerate(D):
            rr,cc=r+dr,c+dc
            if 0<=rr<N and 0<=cc<N and (rr,cc) not in inT: frontier.append((r,c,i))
    addf(*start)
    while frontier:
        r,c,i=frontier.pop(random.randrange(len(frontier)))
        rr,cc=r+D[i][0],c+D[i][1]
        if (rr,cc) in inT: continue
        conn[r][c]|=1<<i; conn[rr][cc]|=1<<((i+2)%4); inT.add((rr,cc)); addf(rr,cc)
    return conn
def orients(m):
    s=[]; 
    for k in range(4):
        x=rot(m,k)
        if x not in s: s.append(x)
    return s
def count(conn,limit=2):
    cells=[(r,c) for r in range(N) for c in range(N)]
    A={}
    sols=[]
    def rec(i):
        if len(sols)>=limit: return
        if i==len(cells):
            # connectivity
            seen={(0,0)}; st=[(0,0)]
            while st:
                r,c=st.pop()
                for b,(dr,dc) in enumerate(D):
                    if A[(r,c)]>>b&1:
                        p=(r+dr,c+dc)
                        if p not in seen: seen.add(p); st.append(p)
            if len(seen)==N*N: sols.append(dict(A))
            return
        r,c=cells[i]
        for o in orients(conn[r][c]):
            good=True
            for b,(dr,dc) in enumerate(D):
                rr,cc=r+dr,c+dc
                has=o>>b&1
                if not(0<=rr<N and 0<=cc<N):
                    if has: good=False;break
                    continue
                if (rr,cc) in A:
                    if has!=(A[(rr,cc)]>>((b+2)%4)&1): good=False;break
            if good:
                A[(r,c)]=o; rec(i+1); del A[(r,c)]
    rec(0); return len(sols)
for seed in range(1,500):
    conn=gen(seed)
    types=[bin(conn[r][c]).count('1') for r in range(N) for c in range(N)]
    leaves=types.count(1)
    if count(conn)==1 and 4<=leaves<=6 and types.count(3)>=2:
        # choose source: a leaf? use a T or straight tile near center
        random.seed(seed*7)
        scr=[[random.randrange(1,4) if bin(conn[r][c]).count('1')<4 else 0 for c in range(N)] for r in range(N)]
        print(seed,conn,leaves,types)
        json.dump({'solution':conn,'scramble':scr},open('/dev/null','w')); break
