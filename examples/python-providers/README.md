# Python Provider Examples

Reference implementations. **Not part of the shipping TypeScript CLI.**

These files demonstrate how a Python-side provider layer could integrate with Net-Runner's routing concepts. They are out-of-band:

- `ollama_provider.py` — local Ollama routing sketch
- `smart_router.py` — latency/cost-scored provider router sketch
- `test_ollama_provider.py`, `test_smart_router.py` — `pytest` suites

## Running

```bash
pip install httpx pytest pytest-asyncio
pytest examples/python-providers/ -v
```

## Scope

The Net-Runner CLI (`bin/net-runner`, `dist/cli.mjs`) is pure TypeScript and does **not** import these. Treat them as design scratchpads. If you want similar behaviour in the shipping product, implement it inside `src/services/api/` and add tests alongside.
