import { fileUrl } from "../api";
import { formatSize } from "./UploadForm";

// Everything that has been uploaded, read back from the API - so a refresh
// shows the same gallery, which is the difference between a preview and a
// stored image.
function Gallery({ images, onDelete }) {
  if (images.length === 0) {
    return (
      <div className="empty">
        <p className="empty__title">Nothing uploaded yet</p>
        <p>Pick an image on the left and it will appear here.</p>
      </div>
    );
  }

  return (
    <div className="gallery">
      {images.map((image) => (
        <figure key={image._id} className="shot">
          {/* Served by the API on port 5004, not by Vite - fileUrl() is what
              turns the stored /uploads/... path into an absolute one. */}
          <a href={fileUrl(image)} target="_blank" rel="noreferrer">
            <img src={fileUrl(image)} alt={image.caption || image.originalName} loading="lazy" />
          </a>

          <figcaption>
            <strong>{image.caption || image.originalName}</strong>
            <span className="muted">
              {formatSize(image.size)} &middot;{" "}
              {new Date(image.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </figcaption>

          <button
            type="button"
            className="btn btn--danger btn--small shot__delete"
            onClick={() => onDelete(image._id)}
          >
            Delete
          </button>
        </figure>
      ))}
    </div>
  );
}

export default Gallery;
