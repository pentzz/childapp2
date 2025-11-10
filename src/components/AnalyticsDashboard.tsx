import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { styles } from '../../styles';
import SkeletonLoader from './SkeletonLoader';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalStories: number;
  totalWorkbooks: number;
  totalCreditsUsed: number;
  storiesThisWeek: number;
  workbooksThisWeek: number;
  newUsersThisWeek: number;
  avgStoriesPerUser: number;
  avgWorkbooksPerUser: number;
}

interface UserActivity {
  user_id: string;
  user_email: string;
  stories_count: number;
  workbooks_count: number;
  credits_used: number;
  last_activity: string;
}

const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');
  const [sortBy, setSortBy] = useState<'stories' | 'workbooks' | 'credits'>('stories');

  // טעינת נתונים אנליטיים
  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // סך כל המשתמשים
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // משתמשים פעילים (פעילות בשבוע האחרון)
      const { count: activeUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_sign_in_at', weekAgo.toISOString());

      // סך כל הסיפורים
      const { count: totalStories } = await supabase
        .from('stories')
        .select('*', { count: 'exact', head: true });

      // סך כל חוברות העבודה
      const { count: totalWorkbooks } = await supabase
        .from('workbooks')
        .select('*', { count: 'exact', head: true });

      // סיפורים בשבוע האחרון
      const { count: storiesThisWeek } = await supabase
        .from('stories')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

      // חוברות בשבוע האחרון
      const { count: workbooksThisWeek } = await supabase
        .from('workbooks')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

      // משתמשים חדשים בשבוע האחרון
      const { count: newUsersThisWeek } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

      // סך קרדיטים שהוצאו (הערכה)
      const totalCreditsUsed =
        (totalStories || 0) * 1 +
        (totalWorkbooks || 0) * 3;

      setAnalytics({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalStories: totalStories || 0,
        totalWorkbooks: totalWorkbooks || 0,
        totalCreditsUsed,
        storiesThisWeek: storiesThisWeek || 0,
        workbooksThisWeek: workbooksThisWeek || 0,
        newUsersThisWeek: newUsersThisWeek || 0,
        avgStoriesPerUser: totalUsers ? (totalStories || 0) / totalUsers : 0,
        avgWorkbooksPerUser: totalUsers ? (totalWorkbooks || 0) / totalUsers : 0,
      });

      // טעינת פעילות משתמשים
      // כאן נצטרך query מורכב יותר - לצורך הדוגמה נעשה פשוט
      const { data: stories } = await supabase
        .from('stories')
        .select('user_id, created_at');

      const { data: workbooks } = await supabase
        .from('workbooks')
        .select('user_id, created_at');

      // צבירת נתונים לפי משתמש
      const userMap = new Map<string, any>();

      stories?.forEach((story) => {
        if (!userMap.has(story.user_id)) {
          userMap.set(story.user_id, {
            user_id: story.user_id,
            stories_count: 0,
            workbooks_count: 0,
            credits_used: 0,
            last_activity: story.created_at,
          });
        }
        const user = userMap.get(story.user_id);
        user.stories_count++;
        user.credits_used += 1;
        if (new Date(story.created_at) > new Date(user.last_activity)) {
          user.last_activity = story.created_at;
        }
      });

      workbooks?.forEach((workbook) => {
        if (!userMap.has(workbook.user_id)) {
          userMap.set(workbook.user_id, {
            user_id: workbook.user_id,
            stories_count: 0,
            workbooks_count: 0,
            credits_used: 0,
            last_activity: workbook.created_at,
          });
        }
        const user = userMap.get(workbook.user_id);
        user.workbooks_count++;
        user.credits_used += 3;
        if (new Date(workbook.created_at) > new Date(user.last_activity)) {
          user.last_activity = workbook.created_at;
        }
      });

      setUserActivities(Array.from(userMap.values()));
    } catch (error) {
      console.error('שגיאה בטעינת אנליטיקה:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // מיון פעילויות משתמשים
  const sortedActivities = useMemo(() => {
    return [...userActivities].sort((a, b) => {
      switch (sortBy) {
        case 'stories':
          return b.stories_count - a.stories_count;
        case 'workbooks':
          return b.workbooks_count - a.workbooks_count;
        case 'credits':
          return b.credits_used - a.credits_used;
        default:
          return 0;
      }
    });
  }, [userActivities, sortBy]);

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <SkeletonLoader type="card" count={4} />
      </div>
    );
  }

  return (
    <div className="fade-in-optimized" style={{
      padding: 'clamp(1rem, 3vw, 2rem)',
      maxWidth: '1600px',
      margin: '0 auto',
    }}>
      {/* כותרת */}
      <div style={{
        marginBottom: 'clamp(2rem, 4vw, 3rem)',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          color: 'var(--primary-color)',
          fontFamily: 'var(--font-serif)',
          marginBottom: '1rem',
        }}>
          📊 לוח ניתוח מתקדם
        </h1>
        <p style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
          color: 'var(--text-secondary)',
        }}>
          מעקב אחר שימוש ופעילות במערכת
        </p>
      </div>

      {/* כרטיסי סטטיסטיקה */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 'clamp(1rem, 2vw, 1.5rem)',
        marginBottom: 'clamp(2rem, 4vw, 3rem)',
      }}>
        {[
          { icon: '👥', label: 'סך כל המשתמשים', value: analytics?.totalUsers || 0, color: 'var(--primary-color)' },
          { icon: '⚡', label: 'משתמשים פעילים', value: analytics?.activeUsers || 0, color: 'var(--accent-color)' },
          { icon: '📚', label: 'סך כל הסיפורים', value: analytics?.totalStories || 0, color: 'var(--secondary-color)' },
          { icon: '📝', label: 'סך כל חוברות', value: analytics?.totalWorkbooks || 0, color: '#9b87f5' },
          { icon: '💎', label: 'קרדיטים שהוצאו', value: analytics?.totalCreditsUsed || 0, color: '#f5d76e' },
          { icon: '🆕', label: 'משתמשים חדשים', value: analytics?.newUsersThisWeek || 0, color: '#56d989' },
        ].map((stat, index) => (
          <div
            key={index}
            className="card-hover-effect stagger-item"
            style={{
              background: 'rgba(127, 217, 87, 0.1)',
              border: `2px solid ${stat.color}`,
              borderRadius: '16px',
              padding: 'clamp(1.5rem, 3vw, 2rem)',
              textAlign: 'center',
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', marginBottom: '0.5rem' }}>
              {stat.icon}
            </div>
            <div style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 'bold',
              color: stat.color,
              marginBottom: '0.5rem',
            }}>
              {stat.value.toLocaleString('he-IL')}
            </div>
            <div style={{
              fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
              color: 'var(--text-secondary)',
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* ממוצעים */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(127, 217, 87, 0.15), rgba(86, 217, 137, 0.1))',
        border: '2px solid var(--primary-color)',
        borderRadius: '16px',
        padding: 'clamp(1.5rem, 3vw, 2rem)',
        marginBottom: 'clamp(2rem, 4vw, 3rem)',
      }}>
        <h2 style={{
          fontSize: 'clamp(1.5rem, 3vw, 2rem)',
          color: 'var(--primary-color)',
          marginBottom: '1rem',
        }}>
          📈 ממוצעים למשתמש
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}>
          <div>
            <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>ממוצע סיפורים:</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)', marginRight: '0.5rem' }}>
              {analytics?.avgStoriesPerUser.toFixed(2)}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>ממוצע חוברות:</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)', marginRight: '0.5rem' }}>
              {analytics?.avgWorkbooksPerUser.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* טבלת פעילות משתמשים */}
      <div style={{
        background: 'rgba(26, 46, 26, 0.5)',
        border: '2px solid var(--glass-border)',
        borderRadius: '16px',
        padding: 'clamp(1.5rem, 3vw, 2rem)',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <h2 style={{
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            color: 'var(--primary-color)',
            margin: 0,
          }}>
            👤 פעילות משתמשים
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['stories', 'workbooks', 'credits'].map((sort) => (
              <button
                key={sort}
                onClick={() => setSortBy(sort as any)}
                style={{
                  ...styles.button,
                  padding: '0.5rem 1rem',
                  fontSize: '0.9rem',
                  background: sortBy === sort
                    ? 'var(--primary-color)'
                    : 'rgba(127, 217, 87, 0.2)',
                  opacity: sortBy === sort ? 1 : 0.7,
                }}
              >
                {sort === 'stories' && '📚 סיפורים'}
                {sort === 'workbooks' && '📝 חוברות'}
                {sort === 'credits' && '💎 קרדיטים'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--primary-color)' }}>
                <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--primary-color)' }}>משתמש</th>
                <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--primary-color)' }}>סיפורים</th>
                <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--primary-color)' }}>חוברות</th>
                <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--primary-color)' }}>קרדיטים</th>
                <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--primary-color)' }}>פעילות אחרונה</th>
              </tr>
            </thead>
            <tbody>
              {sortedActivities.slice(0, 20).map((activity, index) => (
                <tr
                  key={activity.user_id}
                  className="stagger-item"
                  style={{
                    borderBottom: '1px solid var(--glass-border)',
                    transition: 'background 0.3s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(127, 217, 87, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '1rem', color: 'var(--text-light)' }}>
                    {activity.user_id.substring(0, 8)}...
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-light)' }}>
                    {activity.stories_count}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-light)' }}>
                    {activity.workbooks_count}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--accent-color)', fontWeight: 'bold' }}>
                    {activity.credits_used}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {new Date(activity.last_activity).toLocaleDateString('he-IL')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* כפתור רענון */}
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button
          onClick={loadAnalytics}
          style={{
            ...styles.button,
            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
            padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2rem)',
          }}
        >
          🔄 רענן נתונים
        </button>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
