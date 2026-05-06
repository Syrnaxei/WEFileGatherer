// no hooks needed
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
        background: '#f9fafb',
        borderLeft: '1px solid #e5e7eb',
        padding: '16px',
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#374151' }}>
          属性面板
        </h3>
        <p style={{ fontSize: '13px', color: '#6b7280' }}>
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    marginTop: '4px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '13px',
  };

  return (
    <aside style={{
      width: '280px',
      background: '#f9fafb',
      borderLeft: '1px solid #e5e7eb',
      padding: '16px',
      overflowY: 'auto',
    }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#374151' }}>
        属性: {selectedNode.id}
      </h3>

      {type === 'watcher' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>监听路径</label>
            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
              <input
                type="text"
                value={config.watchPath || ''}
                onChange={(e) => updateConfig('watchPath', e.target.value)}
                style={{ ...inputStyle, flex: 1, marginTop: 0 }}
              />
              {isElectron && (
                <button
                  onClick={() => handleSelectDirectory('watchPath')}
                  style={{
                    padding: '6px 12px',
                    background: '#4f46e5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  选择...
                </button>
              )}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>文件匹配模式</label>
            <input
              type="text"
              value={config.filePattern || '*.mp4'}
              onChange={(e) => updateConfig('filePattern', e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
      )}

      {type === 'tagger' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>规则列表 (JSON)</label>
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
              style={{
                width: '100%',
                height: '200px',
                padding: '6px 8px',
                marginTop: '4px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'monospace',
              }}
            />
          </div>
        </div>
      )}

      {type === 'mover' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>目标路径模板</label>
            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
              <input
                type="text"
                value={config.targetPathTemplate || ''}
                onChange={(e) => updateConfig('targetPathTemplate', e.target.value)}
                style={{ ...inputStyle, flex: 1, marginTop: 0 }}
              />
              {isElectron && (
                <button
                  onClick={() => handleSelectDirectory('targetPathTemplate')}
                  style={{
                    padding: '6px 12px',
                    background: '#d97706',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  选择...
                </button>
              )}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>覆盖已有文件</label>
            <input
              type="checkbox"
              checked={!!config.overwrite}
              onChange={(e) => updateConfig('overwrite', e.target.checked)}
              style={{ marginLeft: '8px' }}
            />
          </div>
        </div>
      )}
    </aside>
  );
}
