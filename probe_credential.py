import requests

base='http://127.0.0.1:8000'
company='12a5ff1b-d07e-4aec-a132-36f731c82de0'

r = requests.get(f'{base}/api/company/{company}/agents')
print('agents:', r.status_code)
print(r.text)

if r.status_code != 200:
    raise SystemExit('cannot fetch agents')

agents = r.json().get('agents', [])
if not agents:
    raise SystemExit('no agents')

agent_id = agents[0]['agent_id']
print('using agent', agent_id)

r2 = requests.post(f'{base}/api/company/{company}/agents/{agent_id}/generate-credentials', json={})
print('generate:', r2.status_code)
print(r2.text)
