# Meditations API

```mermaid
flowchart LR
    subgraph Server
    pb(PocketBase) <-->traefik(Traefik)
    end

    traefik <-->|reverse proxy, ssl, rate limit, cache| www(Client)
```
