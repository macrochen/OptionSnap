import { useState, useRef, useEffect } from 'react';
import { UploadCloud, CheckCircle2, Loader2, LogOut, Trash2 } from 'lucide-react';

interface CloudFile {
  key: string;
  size: number;
  uploaded: string;
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('optionsnap_token') || '');
  const [inputToken, setInputToken] = useState('');
  const [category, setCategory] = useState<'Options' | 'Trades'>('Options');
  const [activeTab, setActiveTab] = useState<'Upload' | 'Gallery'>('Upload');

  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gallery State
  const [images, setImages] = useState<CloudFile[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  useEffect(() => {
    if (uploadStatus === 'success' || uploadStatus === 'error') {
      const timer = setTimeout(() => {
        setUploadStatus('idle');
        setErrorMsg('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [uploadStatus]);

  useEffect(() => {
    if (token && activeTab === 'Gallery') {
      fetchImages();
    }
  }, [category, activeTab, token]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputToken) {
      localStorage.setItem('optionsnap_token', inputToken);
      setToken(inputToken);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('optionsnap_token');
    setToken('');
    setInputToken('');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(Array.from(e.target.files));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFiles = async (files: File[]) => {
    setUploadStatus('uploading');
    const formData = new FormData();
    formData.append('category', category);
    files.forEach(file => formData.append('file', file));

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }
      setUploadStatus('success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Upload failed');
      setUploadStatus('error');
    }
  };

  const fetchImages = async () => {
    setIsLoadingImages(true);
    try {
      const response = await fetch(`/api/list?category=${category}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setImages(data.files || []);
      }
    } catch (err) {
      console.error('Failed to fetch images', err);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const deleteImage = async (key: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    try {
      const response = await fetch(`/api/delete?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setImages(images.filter(img => img.key !== key));
      } else {
        alert('Failed to delete image');
      }
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete image');
    }
  };

  if (!token) {
    return (
      <div className="glass-panel auth-container">
        <h1>OptionSnap</h1>
        <p>Enter your secret token to access.</p>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            placeholder="Secret Token"
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value)}
            autoFocus
          />
          <button type="submit" style={{ width: '100%' }}>Enter</button>
        </form>
      </div>
    );
  }

  return (
    <div className="glass-panel">
      <div className="header">
        <h2>OptionSnap</h2>
        <button className="logout-btn" onClick={handleLogout}><LogOut size={16} /></button>
      </div>

      <div className="main-nav">
        <button
          className={`nav-btn ${activeTab === 'Upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('Upload')}
        >
          Upload
        </button>
        <button
          className={`nav-btn ${activeTab === 'Gallery' ? 'active' : ''}`}
          onClick={() => setActiveTab('Gallery')}
        >
          Gallery
        </button>
      </div>

      <div className="category-toggle">
        <button
          className={`category-btn ${category === 'Options' ? 'active' : ''}`}
          onClick={() => setCategory('Options')}
        >
          Options
        </button>
        <button
          className={`category-btn ${category === 'Trades' ? 'active' : ''}`}
          onClick={() => setCategory('Trades')}
        >
          Trades
        </button>
      </div>

      {activeTab === 'Upload' && (
        <div
          className={`upload-zone ${isDragging ? 'drag-active' : ''} ${uploadStatus === 'uploading' ? 'uploading' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept="image/*"
          />

          {uploadStatus === 'idle' && (
            <>
              <UploadCloud className="upload-icon" />
              <div className="upload-text">Tap to select or drag</div>
              <div className="upload-subtext">Images will be sent to {category}</div>
            </>
          )}

          {uploadStatus === 'uploading' && (
            <div className="status-overlay">
              <Loader2 className="spinner spinner-large" />
              <div className="upload-text">Uploading...</div>
            </div>
          )}

          {uploadStatus === 'success' && (
            <div className="status-overlay">
              <CheckCircle2 className="success-icon" />
              <div className="upload-text">Success!</div>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="status-overlay" style={{ background: 'rgba(239, 68, 68, 0.8)' }}>
              <div className="upload-text">Error</div>
              <div className="upload-subtext">{errorMsg}</div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Gallery' && (
        <>
          {isLoadingImages ? (
            <div className="gallery-loading">
              <Loader2 className="spinner spinner-large" />
            </div>
          ) : images.length === 0 ? (
            <div className="empty-state">
              No images in {category}.
            </div>
          ) : (
            <div className="gallery-container">
              {images.map(img => (
                <div key={img.key} className="gallery-item">
                  <img
                    src={`/api/image?key=${encodeURIComponent(img.key)}&token=${encodeURIComponent(token)}`}
                    alt={img.key}
                    loading="lazy"
                  />
                  <button className="delete-btn" onClick={() => deleteImage(img.key)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
