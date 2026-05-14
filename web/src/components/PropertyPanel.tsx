import type { Node } from 'reactflow';

interface PropertyPanelProps {
  selectedNode: Node | null;
  onChange: (nodeId: string, newData: any) => void;
}

export default function PropertyPanel({ selectedNode, onChange }: PropertyPanelProps) {
  const isElectron = !!window.electronAPI;

  if (!selectedNode) {
    return (
      <aside style={{
        width: '280px',
        background: 'var(--bg-surface-1)',
        borderLeft: '1px solid var(--border-default)',
        padding: '16px',
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          属性面板
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          选中节点以编辑配置
        </p>
      </aside>
    );
  }

  const config = (selectedNode.data?.config as Record<string, any>) ?? {};
  const type = selectedNode.type;

  const updateConfig = (key: string, value: any) => {
    onChange(selectedNode.id, {
      ...selectedNode.data,
      config: { ...config, [key]: value },
    });
  };

  const handleSelectDirectory = async (key: string) => {
    if (window.electronAPI) {
      const dir = await window.electronAPI.openDirectory();
      if (dir) {
        updateConfig(key, dir);
      }
    }
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    letterSpacing: '-0.01em',
  };

  return (
    <aside style={{
      width: '280px',
      background: 'var(--bg-surface-1)',
      borderLeft: '1px solid var(--border-default)',
      padding: '16px',
      overflowY: 'auto',
    }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
        属性: {selectedNode.id}
      </h3>

      {type === 'watcher' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={labelStyle}>监听路径</label>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              <input
                type="text"
                value={config.watchPath || ''}
                onChange={(e) => updateConfig('watchPath', e.target.value)}
                className="input input-mono"
                style={{ flex: 1 }}
              />
              {isElectron && (
                <button onClick={() => handleSelectDirectory('watchPath')} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                  选择...
                </button>
              )}
            </div>
          </div>
          <div>
            <label style={labelStyle}>文件匹配模式</label>
            <input
              type="text"
              value={config.filePattern || '*.mp4'}
              onChange={(e) => updateConfig('filePattern', e.target.value)}
              className="input input-mono"
              style={{ marginTop: '4px' }}
            />
          </div>
        </div>
      )}

      {type === 'tagger' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={labelStyle}>规则列表 (JSON)</label>
            <textarea
              value={JSON.stringify(config.rules ?? [], null, 2)}
              onChange={(e) => {
                try {
                  const rules = JSON.parse(e.target.value);
                  updateConfig('rules', rules);
                } catch {
                  // ignore invalid JSON during typing
                }
              }}
              className="input input-mono"
              style={{ height: '200px', marginTop: '4px', resize: 'vertical' }}
            />
          </div>
        </div>
      )}

      {type === 'mover' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={labelStyle}>目标路径模板</label>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              <input
                type="text"
                value={config.targetPathTemplate || ''}
                onChange={(e) => updateConfig('targetPathTemplate', e.target.value)}
                className="input input-mono"
                style={{ flex: 1 }}
              />
              {isElectron && (
                <button
                  onClick={() => handleSelectDirectory('targetPathTemplate')}
                  className="btn"
                  style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--warning)', color: '#fff' }}
                >
                  选择...
                </button>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ ...labelStyle, margin: 0 }}>覆盖已有文件</label>
            <input
              type="checkbox"
              checked={!!config.overwrite}
              onChange={(e) => updateConfig('overwrite', e.target.checked)}
            />
          </div>
        </div>
      )}
    </aside>
  );
}
