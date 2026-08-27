import { useState } from "react";
import Header from "./components/Header";
import Card from "./components/Card";
import Form from "./components/Form";
import Footer from "./components/Footer";
import Button from "./components/Button";

/** Starting data. In a real app this would come from an API. */
const INITIAL_PROJECTS = [
  {
    id: 1,
    title: "Multi-Modal Deepfake Detection",
    description:
      "Detects lip-sync deepfakes by exploiting disagreement between the visual and audio streams. Five parallel streams fused by an MLP.",
    tags: ["Python", "PyTorch", "DINOv2"],
    status: "In progress",
  },
  {
    id: 2,
    title: "PCEase",
    description:
      "Full stack PC building platform tracking real-time component prices across 9 Indian retailers, with an AI build advisor.",
    tags: ["React", "FastAPI", "Supabase"],
  },
  {
    id: 3,
    title: "SilverGuard",
    description:
      "Mobile app protecting elderly users from digital arrest scams using a coercion interlock and real-time keyword detection.",
    tags: ["Flutter", "Kotlin", "N8N"],
  },
];

const FOOTER_LINKS = [
  { label: "GitHub", href: "https://github.com/adithya-jithesh" },
  { label: "LinkedIn", href: "https://linkedin.com/in/adithyajithesh" },
];

function App() {
  /* ── STATE ──────────────────────────────────────────────────────────
     Three independent pieces of state. Each useState call returns a pair:
     the current value, and a function to replace it. Calling the setter
     tells React to re-render this component and everything below it.  */
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [theme, setTheme] = useState("dark");
  const [query, setQuery] = useState("");

  /* ── DERIVED VALUE ──────────────────────────────────────────────────
     NOT state. It's computed from projects + query on every render, so it
     can never disagree with them. Rule: if you can calculate it from
     existing state, don't store it in state.                            */
  const visibleProjects = projects.filter((project) => {
    const haystack = `${project.title} ${project.description} ${project.tags.join(" ")}`;
    return haystack.toLowerCase().includes(query.trim().toLowerCase());
  });

  function handleAddProject(newProject) {
    setProjects((previous) => [
      // Date.now() is a quick unique id. A real app would use a UUID or a
      // database id - never the array index, which changes on delete.
      { ...newProject, id: Date.now() },
      ...previous, // spread the old items after the new one → newest first
    ]);
  }

  function handleRemoveProject(id) {
    // filter returns a NEW array. We never mutate the existing one.
    setProjects((previous) => previous.filter((project) => project.id !== id));
  }

  function handleToggleTheme() {
    setTheme((previous) => (previous === "dark" ? "light" : "dark"));
  }

  return (
    // The theme class lives on the outermost element; CSS variables inside
    // .app--light override the dark defaults for everything beneath it.
    <div className={`app app--${theme}`}>
      <Header
        title="React Components Practice"
        subtitle="Week 1 - Header, Footer, Card, Button and Form built as reusable components."
        count={projects.length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <main className="main">
        <section className="panel">
          <Form onAddProject={handleAddProject} />
        </section>

        <section className="panel">
          <div className="toolbar">
            <input
              className="toolbar__search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search projects…"
            />
            <Button variant="ghost" onClick={() => setProjects(INITIAL_PROJECTS)}>
              Reset
            </Button>
          </div>

          {/* Conditional rendering with a ternary: empty state vs the grid. */}
          {visibleProjects.length === 0 ? (
            <p className="empty">
              No projects match “{query}”. Try a different search.
            </p>
          ) : (
            <div className="grid">
              {visibleProjects.map((project) => (
                <Card
                  key={project.id}
                  id={project.id}
                  title={project.title}
                  description={project.description}
                  tags={project.tags}
                  status={project.status}
                  onRemove={handleRemoveProject}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer name="Adithya Jithesh" links={FOOTER_LINKS} />
    </div>
  );
}

export default App;
