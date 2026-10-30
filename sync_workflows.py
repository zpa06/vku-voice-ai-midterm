import sqlite3
import json
import uuid
import datetime
import os

base_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(base_dir, 'n8n_data', 'database.sqlite')

if not os.path.exists(db_path):
    print(f"[!] Database not found at {db_path}")
    exit(0)

conn = sqlite3.connect(db_path)
cur = conn.cursor()

project_id = 'V37ONcM6OrMZNweh'
now_str = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]

workflows_to_insert = [
    {
        'id': 'WF01_PHUANH_GATE',
        'file': 'workflow_1_phuanh_gateway.json',
        'name': 'Luong 1: Nguyen Phu Anh - Inbound Gateway & Security Guardrail'
    },
    {
        'id': 'WF02_DINHANH_VOX',
        'file': 'workflow_2_dinhanh_voice_ux.json',
        'name': 'Luong 2: Nguyen Dinh Anh - Smart Voice UX & Multi-Agent Router'
    },
    {
        'id': 'WF03_DUCHUE_HITL',
        'file': 'workflow_3_duchue_hitl.json',
        'name': 'Luong 3: Le Duc Hue - Risk Evaluator & Human Approval Queue'
    },
    {
        'id': 'WF04_VY_RAG_CRM',
        'file': 'workflow_4_vy_rag_crm.json',
        'name': 'Luong 4: Vy - RAG Knowledge Base & CRM Lead Sync'
    },
    {
        'id': 'OOAUqUzxzizGO7kt',
        'file': 'voice_workflow.json',
        'name': 'Luong Master: Toan Bo He Thong Voice AI (VKU Midterm)'
    }
]

for item in workflows_to_insert:
    wf_path = os.path.join(base_dir, item['file'])
    if not os.path.exists(wf_path):
        continue
    with open(wf_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    nodes_str = json.dumps(data.get('nodes', []))
    conn_str = json.dumps(data.get('connections', {}))
    settings_str = json.dumps(data.get('settings', {"executionOrder": "v1"}))
    ver_id = str(uuid.uuid4())
    
    cur.execute("DELETE FROM workflow_entity WHERE id=?", (item['id'],))
    cur.execute("DELETE FROM shared_workflow WHERE workflowId=?", (item['id'],))
    
    cur.execute("""
        INSERT INTO workflow_entity (
            id, name, active, nodes, connections, settings, staticData, pinData,
            versionId, triggerCount, meta, parentFolderId, createdAt, updatedAt,
            isArchived, versionCounter, description, activeVersionId, nodeGroups, sourceWorkflowId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        item['id'],
        item['name'],
        1,
        nodes_str,
        conn_str,
        settings_str,
        None,
        None,
        ver_id,
        1,
        None,
        None,
        now_str,
        now_str,
        0,
        1,
        None,
        ver_id,
        '[]',
        None
    ))
    
    cur.execute("""
        INSERT INTO shared_workflow (workflowId, projectId, role, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?)
    """, (
        item['id'],
        project_id,
        'workflow:owner',
        now_str,
        now_str
    ))
    print(f"[+] Loaded workflow: {item['name']} ({item['id']})")

conn.commit()
conn.close()
print("[+] Synchronized all 4 member workflows into n8n successfully!")
