import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { searchFAQs, getSuggestions } from '../api/searchApi';
import SearchBar from '../components/SearchBar';
import SearchSuggestions from '../components/SearchSuggestions';
import SearchResults from '../components/SearchResults';
import '../styles/search.css';

const CATEGORIES = [
  'about-internship', 'certificate', 'code-of-conduct', 'coursework-vibe',
  'interviews', 'noc', 'rosetta', 'selection-offer', 'team-formation',
  'timing-dates', 'vibe-platform', 'work-mentorship', 'yaksha-chat',
  'programme-overview',
];

export default function UserPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [semanticResults, setSemanticResults] = useState(null);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [faqs, setFaqs] = useState([]);
  const [faqsLoading, setFaqsLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [highlightedFaq, setHighlightedFaq] = useState(null);
  const debounceRef = useRef(null);
  const overviewRef = useRef(null);
  const faqRefs = useRef({});
  const searchContainerRef = useRef(null);

  useEffect(() => {
    fetchAllFAQs();
    fetchOverview();
  }, []);

  const fetchAllFAQs = async () => {
    setFaqsLoading(true);
    try {
      const { data } = await api.get('/faqs?limit=200');
      setFaqs(data.results || []);
    } catch {
      setFaqs([]);
    } finally {
      setFaqsLoading(false);
    }
  };

  const fetchOverview = async () => {
    try {
      const { data } = await api.get('/internship/overview');
      if (data.success) setOverview(data.sections);
    } catch {
      // ignore
    } finally {
      setOverviewLoading(false);
    }
  };

  const fetchSuggestions = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setSuggestionsLoading(true);
    try {
      const data = await getSuggestions(q);
      setSuggestions(data.results || []);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 3) return;
    setQuery(q);
    setShowSuggestions(false);
    setSemanticLoading(true);
    setSemanticResults(null);
    try {
      const data = await searchFAQs(q);
      setSemanticResults(data);
    } catch {
      setSemanticResults(null);
    } finally {
      setSemanticLoading(false);
    }
  }, []);

  const handleSelectSuggestion = useCallback((suggestion) => {
    if (!suggestion) {
      setQuery('');
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setQuery(suggestion.question);
    setShowSuggestions(false);
    handleSearch(suggestion.question);
  }, [handleSearch]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch(query);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else {
        handleSearch(query);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="auth-container" style={{ flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)', backdropFilter: 'blur(16px)'
      }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Samagama FAQs</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--accent)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff'
          }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{user?.name}</span>
          <button onClick={handleLogout} style={{
            padding: '6px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            fontSize: 13, background: 'transparent', color: 'var(--text-secondary)',
            cursor: 'pointer', fontFamily: 'inherit'
          }}
            onMouseOver={e => { e.currentTarget.style.background = 'var(--error)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--error)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
            Sign out
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 720, margin: '0 auto', width: '100%', padding: '32px 24px 60px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 8 }}>How can we help you?</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Search our knowledge base for instant answers</p>
        </div>

        <div ref={searchContainerRef} className="faq-page-search-area" style={{ marginBottom: 24 }}>
          <SearchBar
            onSearch={handleSearch}
            onSelectSuggestion={handleSelectSuggestion}
            loading={semanticLoading}
          />
          {showSuggestions && (
            <SearchSuggestions
              suggestions={suggestions}
              loading={suggestionsLoading}
              onSelect={handleSelectSuggestion}
              selectedIndex={selectedIndex}
              query={query}
            />
          )}
          <SearchResults
            results={semanticResults}
            loading={semanticLoading}
            onSelectQuestion={(q) => handleSearch(q)}
            query={query}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {CATEGORIES.map(cat => {
            const active = cat === activeCategory;
            const label = cat === 'programme-overview' ? 'Programme Overview' : cat.replace(/-/g, ' ');
            return (
              <button
                key={cat}
                onClick={() => {
                  if (cat === 'programme-overview') {
                    setQuery('');
                    setShowResults(false);
                    setActiveCategory(null);
                    setOverviewOpen(true);
                    setTimeout(() => overviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                  } else {
                    setActiveCategory(activeCategory === cat ? null : cat);
                  }
                }}
                style={{
                  padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border)',
                  fontSize: 13, fontWeight: cat === activeCategory ? 600 : 400,
                  background: cat === activeCategory ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: cat === activeCategory ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms ease', textTransform: 'capitalize'
                }}
                onMouseOver={e => { if (cat !== activeCategory) { e.currentTarget.style.background = 'var(--accent-light)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}}
                onMouseOut={e => { if (cat !== activeCategory) { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}}
              >
                {label}
              </button>
            );
          })}
        </div>

        {(faqsLoading ? (
          <div>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ height: 48, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', marginBottom: 8, animation: 'shimmer 1.5s infinite', backgroundImage: 'linear-gradient(90deg, var(--bg-secondary) 0%, var(--bg-card) 50%, var(--bg-secondary) 100%)', backgroundSize: '200% 100%' }} />
            ))}
          </div>
        ) : (
          <div>
            {(activeCategory ? faqs.filter(f => f.category === activeCategory) : faqs).map(faq => (
              <details key={faq._id} open={highlightedFaq === faq._id}
                ref={el => { if (el) faqRefs.current[faq._id] = el; }}
                onToggle={e => { if (!e.target.open && highlightedFaq === faq._id) setHighlightedFaq(null); }}
                style={{
                background: highlightedFaq === faq._id ? 'var(--accent-light)' : 'var(--bg-card)',
                backdropFilter: 'blur(16px)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                marginBottom: 8, overflow: 'hidden'
              }}>
                <summary style={{
                  padding: '14px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 500,
                  color: 'var(--text-primary)'
                }}>
                  {faq.question}
                </summary>
                <div style={{ padding: '0 20px 16px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        ))}

        <div ref={overviewRef} style={{
          background: 'var(--bg-card)', backdropFilter: 'blur(16px)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
          marginTop: 24, overflow: 'hidden'
        }}>
          <div
            onClick={() => setOverviewOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', cursor: 'pointer',
              fontWeight: 600, fontSize: 15
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              Programme Overview
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ transform: overviewOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          {overviewOpen && (
            <div style={{ borderTop: '1px solid var(--border)', padding: '20px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              {overviewLoading ? (
                <div style={{ color: 'var(--text-muted)' }}>Loading…</div>
              ) : overview ? (
                overview.map((section, i) => {
                  switch (section.type) {
                    case 'lead':
                      return <p key={i} style={{ fontSize: 15, marginBottom: 16 }}>{section.content}</p>;
                    case 'heading':
                      return <h3 key={i} style={{ fontSize: 16, fontWeight: 600, margin: '20px 0 10px', color: 'var(--text-primary)' }}>{section.content}</h3>;
                    case 'text':
                      return <p key={i} style={{ marginBottom: 12 }} dangerouslySetInnerHTML={{ __html: section.html }} />;
                    case 'note':
                      return <div key={i} style={{ background: 'var(--accent-light)', padding: 12, borderRadius: 'var(--radius-sm)', marginBottom: 12, borderLeft: '3px solid var(--accent)' }}>{section.content}</div>;
                    case 'tracks':
                      return section.tracks.map((t, ti) => (
                        <div key={`${i}-${ti}`} style={{ marginBottom: 16 }}>
                          <strong style={{ color: 'var(--text-primary)' }}>{t.title}</strong>
                          <p style={{ marginTop: 4 }}>{t.content}</p>
                        </div>
                      ));
                    case 'table':
                      return (
                        <div key={i} style={{ overflowX: 'auto', marginBottom: 16 }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                              <tr style={{ background: 'var(--bg-secondary)' }}>
                                {['Badge', 'Phase', 'Description', 'Required?'].map(h => (
                                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid var(--border)', fontWeight: 600 }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {section.rows.map((row, ri) => (
                                <tr key={ri}>
                                  {row.map((cell, ci) => (
                                    <td key={ci} style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>{cell}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    case 'list':
                      return (
                        <ul key={i} style={{ paddingLeft: 20, marginBottom: 12 }}>
                          {section.items.map((item, li) => (
                            <li key={li} style={{ marginBottom: 4 }}>{item}</li>
                          ))}
                        </ul>
                      );
                    case 'ordered-list':
                      return (
                        <ol key={i} style={{ paddingLeft: 20, marginBottom: 12 }}>
                          {section.items.map((item, li) => (
                            <li key={li} style={{ marginBottom: 4 }}>{item}</li>
                          ))}
                        </ol>
                      );
                    default:
                      return null;
                  }
                })
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Failed to load overview</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
