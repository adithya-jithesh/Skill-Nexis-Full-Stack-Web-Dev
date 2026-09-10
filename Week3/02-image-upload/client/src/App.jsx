import { useEffect, useState } from "react";
import { api } from "./api";
import Gallery from "./components/Gallery";
import UploadForm from "./components/UploadForm";

function App() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    api
      .getImages()
      .then((result) => {
        if (!cancelled) setImages(result.data);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // The upload response already contains the new record, so the gallery is
  // updated from that instead of fetching the whole list again.
  function handleUploaded(image) {
    setImages((current) => [image, ...current]);
  }

  async function handleDelete(id) {
    // Remember the list, so it can be put back if the server says no.
    const previous = images;
    setImages((current) => current.filter((image) => image._id !== id));

    try {
      await api.deleteImage(id);
    } catch (deleteError) {
      setImages(previous);
      setError(deleteError.message);
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Image upload</h1>
        <p>
          SkillNexis Week 3, assignment 2 &middot; Multer on the server, preview and gallery in
          React
        </p>
      </header>

      <main className="layout">
        <div className="layout__side">
          <UploadForm onUploaded={handleUploaded} />
        </div>

        <div className="layout__main">
          <div className="section-head">
            <h2>Uploaded</h2>
            <span className="muted">{images.length} image{images.length === 1 ? "" : "s"}</span>
          </div>

          {error && <p className="alert alert--error">{error}</p>}

          {loading ? (
            <div className="gallery">
              <div className="skeleton" />
              <div className="skeleton" />
              <div className="skeleton" />
            </div>
          ) : (
            <Gallery images={images} onDelete={handleDelete} />
          )}
        </div>
      </main>

      <footer className="footer">
        <span>Adithya Jithesh &middot; SkillNexis Week 3</span>
        <span className="footer__links">
          <a href="https://github.com/adithya-jithesh">GitHub</a>
          <a href="https://linkedin.com/in/adithyajithesh">LinkedIn</a>
        </span>
      </footer>
    </div>
  );
}

export default App;
