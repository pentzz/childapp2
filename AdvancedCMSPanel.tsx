import React, { useState, useEffect } from 'react';
import { supabase } from './src/supabaseClient';

interface Section {
    id: number;
    section_key: string;
    section_type: string;
    title: string;
    subtitle: string;
    background_color: string;
    background_image: string | null;
    padding_top: number;
    padding_bottom: number;
    display_order: number;
    is_active: boolean;
    is_system: boolean;
}

interface MenuItem {
    id: number;
    menu_location: string;
    label: string;
    link_url: string;
    icon: string | null;
    display_order: number;
    is_active: boolean;
}

interface SiteSetting {
    id: number;
    setting_key: string;
    setting_value: string;
    setting_type: string;
    category: string;
    description: string;
}

interface AdvancedCMSPanelProps {
    onClose: () => void;
}

const AdvancedCMSPanel: React.FC<AdvancedCMSPanelProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<'sections' | 'menu' | 'settings' | 'media'>('sections');
    const [sections, setSections] = useState<Section[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [siteSettings, setSiteSettings] = useState<SiteSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [draggedSection, setDraggedSection] = useState<number | null>(null);

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        await Promise.all([
            loadSections(),
            loadMenuItems(),
            loadSiteSettings()
        ]);
        setLoading(false);
    };

    const loadSections = async () => {
        const { data, error } = await supabase
            .from('cms_sections')
            .select('*')
            .order('display_order');

        if (error) {
            console.error('Error loading sections:', error);
        } else {
            setSections(data || []);
        }
    };

    const loadMenuItems = async () => {
        const { data, error } = await supabase
            .from('cms_menu_items')
            .select('*')
            .order('display_order');

        if (error) {
            console.error('Error loading menu items:', error);
        } else {
            setMenuItems(data || []);
        }
    };

    const loadSiteSettings = async () => {
        const { data, error } = await supabase
            .from('cms_site_settings')
            .select('*')
            .order('category', { ascending: true });

        if (error) {
            console.error('Error loading site settings:', error);
        } else {
            setSiteSettings(data || []);
        }
    };

    // Section Management
    const addNewSection = async () => {
        const sectionKey = `section_${Date.now()}`;
        const { data, error } = await supabase
            .from('cms_sections')
            .insert([{
                section_key: sectionKey,
                section_type: 'custom',
                title: 'סקשן חדש',
                subtitle: 'תיאור הסקשן',
                display_order: sections.length,
                is_active: true,
                is_system: false
            }])
            .select()
            .single();

        if (error) {
            alert('שגיאה ביצירת סקשן: ' + error.message);
        } else {
            setSections([...sections, data]);
        }
    };

    const updateSection = async (id: number, updates: Partial<Section>) => {
        const { error } = await supabase
            .from('cms_sections')
            .update(updates)
            .eq('id', id);

        if (error) {
            alert('שגיאה בעדכון סקשן: ' + error.message);
        } else {
            setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
        }
    };

    const deleteSection = async (id: number) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק סקשן זה?')) return;

        const { error } = await supabase
            .from('cms_sections')
            .delete()
            .eq('id', id);

        if (error) {
            alert('שגיאה במחיקת סקשן: ' + error.message);
        } else {
            setSections(sections.filter(s => s.id !== id));
        }
    };

    const reorderSections = async (fromIndex: number, toIndex: number) => {
        const newSections = [...sections];
        const [movedSection] = newSections.splice(fromIndex, 1);
        newSections.splice(toIndex, 0, movedSection);

        // Update display_order for all affected sections
        const updates = newSections.map((section, index) => ({
            id: section.id,
            display_order: index
        }));

        for (const update of updates) {
            await supabase
                .from('cms_sections')
                .update({ display_order: update.display_order })
                .eq('id', update.id);
        }

        setSections(newSections);
    };

    // Menu Management
    const addMenuItem = async () => {
        const { data, error } = await supabase
            .from('cms_menu_items')
            .insert([{
                menu_location: 'header',
                label: 'פריט חדש',
                link_url: '#',
                display_order: menuItems.length,
                is_active: true
            }])
            .select()
            .single();

        if (error) {
            alert('שגיאה ביצירת פריט תפריט: ' + error.message);
        } else {
            setMenuItems([...menuItems, data]);
        }
    };

    const updateMenuItem = async (id: number, updates: Partial<MenuItem>) => {
        const { error } = await supabase
            .from('cms_menu_items')
            .update(updates)
            .eq('id', id);

        if (error) {
            alert('שגיאה בעדכון פריט תפריט: ' + error.message);
        } else {
            setMenuItems(menuItems.map(m => m.id === id ? { ...m, ...updates } : m));
        }
    };

    const deleteMenuItem = async (id: number) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק פריט זה?')) return;

        const { error } = await supabase
            .from('cms_menu_items')
            .delete()
            .eq('id', id);

        if (error) {
            alert('שגיאה במחיקת פריט: ' + error.message);
        } else {
            setMenuItems(menuItems.filter(m => m.id !== id));
        }
    };

    // Settings Management
    const updateSetting = async (key: string, value: string) => {
        const { error } = await supabase
            .from('cms_site_settings')
            .update({ setting_value: value })
            .eq('setting_key', key);

        if (error) {
            alert('שגיאה בעדכון הגדרה: ' + error.message);
        } else {
            setSiteSettings(siteSettings.map(s =>
                s.setting_key === key ? { ...s, setting_value: value } : s
            ));
        }
    };

    const panelStyles: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        right: 0,
        width: '450px',
        height: '100vh',
        background: 'linear-gradient(135deg, rgba(15, 30, 15, 0.98), rgba(25, 45, 25, 0.98))',
        backdropFilter: 'blur(20px)',
        borderLeft: '2px solid var(--primary-color)',
        boxShadow: '-10px 0 50px rgba(0, 0, 0, 0.5)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        color: 'white',
        animation: 'slideInRight 0.3s ease-out',
        overflowY: 'auto'
    };

    const headerStyles: React.CSSProperties = {
        padding: '1.5rem',
        borderBottom: '1px solid rgba(127, 217, 87, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        background: 'inherit',
        zIndex: 10
    };

    const tabStyles = (isActive: boolean): React.CSSProperties => ({
        padding: '0.75rem 1.5rem',
        background: isActive ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' : 'transparent',
        border: isActive ? 'none' : '1px solid rgba(127, 217, 87, 0.3)',
        borderRadius: '12px',
        color: 'white',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: isActive ? 'bold' : 'normal',
        transition: 'all 0.3s ease',
        flex: 1
    });

    const sectionCardStyles: React.CSSProperties = {
        background: 'rgba(26, 46, 26, 0.6)',
        border: '1px solid rgba(127, 217, 87, 0.3)',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '1rem',
        cursor: 'grab',
        transition: 'all 0.2s ease'
    };

    if (loading) {
        return (
            <div style={panelStyles}>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚙️</div>
                    <div>טוען פאנל CMS...</div>
                </div>
            </div>
        );
    }

    return (
        <>
            <style>{`
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .cms-panel-input {
                    width: 100%;
                    padding: 0.75rem;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(127, 217, 87, 0.3);
                    border-radius: 8px;
                    color: white;
                    font-size: 0.9rem;
                    margin-top: 0.5rem;
                }
                .cms-panel-input:focus {
                    outline: none;
                    border-color: var(--primary-color);
                    box-shadow: 0 0 10px rgba(127, 217, 87, 0.3);
                }
                .cms-panel-button {
                    padding: 0.6rem 1.2rem;
                    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin-top: 0.5rem;
                }
                .cms-panel-button:hover {
                    transform: scale(1.05);
                    box-shadow: 0 5px 20px rgba(127, 217, 87, 0.4);
                }
                .cms-panel-button-danger {
                    background: linear-gradient(135deg, #ff6b6b, #ff8787);
                }
            `}</style>
            <div style={panelStyles}>
                <div style={headerStyles}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>⚙️ פאנל CMS מתקדם</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            fontSize: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ padding: '1rem', borderBottom: '1px solid rgba(127, 217, 87, 0.3)', display: 'flex', gap: '0.5rem' }}>
                    <button style={tabStyles(activeTab === 'sections')} onClick={() => setActiveTab('sections')}>
                        📄 סקשנים
                    </button>
                    <button style={tabStyles(activeTab === 'menu')} onClick={() => setActiveTab('menu')}>
                        🍔 תפריט
                    </button>
                    <button style={tabStyles(activeTab === 'settings')} onClick={() => setActiveTab('settings')}>
                        ⚙️ הגדרות
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
                    {activeTab === 'sections' && (
                        <div>
                            <button className="cms-panel-button" onClick={addNewSection} style={{ width: '100%', marginBottom: '1rem' }}>
                                ➕ הוסף סקשן חדש
                            </button>

                            {sections.map((section, index) => (
                                <div
                                    key={section.id}
                                    style={sectionCardStyles}
                                    draggable
                                    onDragStart={() => setDraggedSection(index)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => {
                                        if (draggedSection !== null) {
                                            reorderSections(draggedSection, index);
                                            setDraggedSection(null);
                                        }
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '1.5rem', cursor: 'grab' }}>⋮⋮</span>
                                            <strong>{section.title}</strong>
                                            {section.is_system && <span style={{ fontSize: '0.8rem', background: 'rgba(255, 215, 0, 0.3)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>מערכת</span>}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => updateSection(section.id, { is_active: !section.is_active })}
                                                style={{
                                                    background: section.is_active ? 'rgba(127, 217, 87, 0.3)' : 'rgba(255, 107, 107, 0.3)',
                                                    border: 'none',
                                                    padding: '0.4rem 0.8rem',
                                                    borderRadius: '6px',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                {section.is_active ? '👁️' : '🚫'}
                                            </button>
                                            {!section.is_system && (
                                                <button
                                                    onClick={() => deleteSection(section.id)}
                                                    style={{
                                                        background: 'rgba(255, 107, 107, 0.3)',
                                                        border: 'none',
                                                        padding: '0.4rem 0.8rem',
                                                        borderRadius: '6px',
                                                        color: 'white',
                                                        cursor: 'pointer',
                                                        fontSize: '0.8rem'
                                                    }}
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                                        <div>📌 סוג: {section.section_type}</div>
                                        <div>📊 מיקום: {section.display_order}</div>
                                    </div>

                                    <input
                                        className="cms-panel-input"
                                        type="text"
                                        value={section.title}
                                        onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                        placeholder="כותרת הסקשן"
                                    />
                                    <input
                                        className="cms-panel-input"
                                        type="text"
                                        value={section.subtitle}
                                        onChange={(e) => updateSection(section.id, { subtitle: e.target.value })}
                                        placeholder="תת-כותרת"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'menu' && (
                        <div>
                            <button className="cms-panel-button" onClick={addMenuItem} style={{ width: '100%', marginBottom: '1rem' }}>
                                ➕ הוסף פריט תפריט
                            </button>

                            {menuItems.map((item) => (
                                <div key={item.id} style={{ ...sectionCardStyles, cursor: 'default' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <strong>{item.icon} {item.label}</strong>
                                        <button
                                            onClick={() => deleteMenuItem(item.id)}
                                            style={{
                                                background: 'rgba(255, 107, 107, 0.3)',
                                                border: 'none',
                                                padding: '0.4rem 0.8rem',
                                                borderRadius: '6px',
                                                color: 'white',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            🗑️
                                        </button>
                                    </div>

                                    <input
                                        className="cms-panel-input"
                                        type="text"
                                        value={item.label}
                                        onChange={(e) => updateMenuItem(item.id, { label: e.target.value })}
                                        placeholder="תווית"
                                    />
                                    <input
                                        className="cms-panel-input"
                                        type="text"
                                        value={item.link_url}
                                        onChange={(e) => updateMenuItem(item.id, { link_url: e.target.value })}
                                        placeholder="קישור"
                                    />
                                    <input
                                        className="cms-panel-input"
                                        type="text"
                                        value={item.icon || ''}
                                        onChange={(e) => updateMenuItem(item.id, { icon: e.target.value })}
                                        placeholder="אייקון (אימוג'י)"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div>
                            {['general', 'design', 'seo'].map(category => {
                                const categorySettings = siteSettings.filter(s => s.category === category);
                                if (categorySettings.length === 0) return null;

                                const categoryNames: Record<string, string> = {
                                    general: '🌐 כללי',
                                    design: '🎨 עיצוב',
                                    seo: '🔍 SEO'
                                };

                                return (
                                    <div key={category} style={{ marginBottom: '2rem' }}>
                                        <h3 style={{ marginBottom: '1rem', color: 'var(--primary-light)' }}>
                                            {categoryNames[category]}
                                        </h3>
                                        {categorySettings.map(setting => (
                                            <div key={setting.id} style={{ marginBottom: '1.5rem' }}>
                                                <label style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)', display: 'block', marginBottom: '0.5rem' }}>
                                                    {setting.description || setting.setting_key}
                                                </label>
                                                {setting.setting_type === 'color' ? (
                                                    <input
                                                        type="color"
                                                        value={setting.setting_value}
                                                        onChange={(e) => updateSetting(setting.setting_key, e.target.value)}
                                                        style={{ width: '100%', height: '50px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                                    />
                                                ) : setting.setting_type === 'boolean' ? (
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={setting.setting_value === 'true'}
                                                            onChange={(e) => updateSetting(setting.setting_key, e.target.checked ? 'true' : 'false')}
                                                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                                        />
                                                        <span>{setting.setting_value === 'true' ? 'מופעל' : 'כבוי'}</span>
                                                    </label>
                                                ) : (
                                                    <input
                                                        className="cms-panel-input"
                                                        type={setting.setting_type === 'number' ? 'number' : 'text'}
                                                        value={setting.setting_value}
                                                        onChange={(e) => updateSetting(setting.setting_key, e.target.value)}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default AdvancedCMSPanel;
