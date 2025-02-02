import { getMDXComponent } from "mdx-bundler/client"
import React from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/router"
import Head from "next/head"
import Link from "next/link"
import { toProps } from "../../src/page-data"

export async function getServerSideProps({ params }) {
  try {
    const { demo, theme } = params
    const props = await toProps({ theme, demo })
    return { props }
  } catch (e) {
    console.error(
      "getServerSideProps error",
      JSON.stringify(e, null, 2)
    )
  }
  return { props: { error: true } }
}

export default function Page({
  error,
  source,
  preCodeHike,
  postCodeHike,
  result,
  demos,
  themes,
  currentTheme,
  currentDemo,
}) {
  if (error) {
    return <div>Compilation Error</div>
  }
  return (
    <div>
      <Head>
        <title>Code Hike Playground</title>
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
      </Head>
      <Main
        {...{ source, preCodeHike, postCodeHike, result }}
      />
      <Nav
        {...{ currentDemo, currentTheme, demos, themes }}
      />
    </div>
  )
}

const Main = React.memo(function Main({
  source,
  preCodeHike,
  postCodeHike,
  result,
}) {
  return (
    <main>
      <div className="columns">
        <Column column="mdx">
          <div
            dangerouslySetInnerHTML={{ __html: source }}
          />
        </Column>
        <Column column="pre-ch">
          <MDXComponent code={preCodeHike} />
        </Column>
        <Column column="post-ch">
          <MDXComponent code={postCodeHike} />
        </Column>
        <Column column="result" className="tailwind-font">
          <ErrorBoundary>
            <MDXComponent code={result} />
          </ErrorBoundary>
        </Column>
      </div>
    </main>
  )
})

function Nav({ currentDemo, currentTheme, demos, themes }) {
  const router = useRouter()
  return (
    <nav>
      <h1>
        <Link href="/">
          <a>Code Hike Playground</a>
        </Link>
      </h1>
      <span className="version">
        v0.3.0--canary.77.2616b6b.0
      </span>
      <div style={{ flex: 1 }} />
      <label>
        Demo
        <select
          value={currentDemo}
          onChange={e => {
            router.push({
              pathname: `/${e.target.value}/${currentTheme}`,
              query: router.query.columns
                ? {
                    columns: router.query.columns,
                  }
                : {},
            })
          }}
        >
          {demos.map(demo => (
            <option key={demo}>{demo}</option>
          ))}
        </select>
      </label>
      <label>
        Theme
        <select
          value={currentTheme}
          onChange={e => {
            router.push({
              pathname: `/${currentDemo}/${e.target.value}`,
              query: router.query.columns
                ? {
                    columns: router.query.columns,
                  }
                : {},
            })
          }}
        >
          {themes.map(theme => (
            <option key={theme}>{theme}</option>
          ))}
        </select>
      </label>
      <label>
        Columns
        <div className="radio">
          <Toggle column="mdx" />
          <Toggle column="pre-ch" />
          <Toggle column="post-ch" />
          <Toggle column="result" />
        </div>
      </label>
    </nav>
  )
}
const COLUMNS = {
  mdx: {
    label: "MDX",
  },
  "pre-ch": {
    title: "MDAST before CH",
    label: "Pre Code Hike",
  },
  "post-ch": {
    title: "MDAST after CH",
    label: "Post Code Hike",
  },
  result: {
    label: "Result",
  },
}
const DEFAULT_COLUMNS = ["mdx", "result"]

function useColumns() {
  const { query } = useRouter()
  return query.columns
    ? query.columns.split(",")
    : DEFAULT_COLUMNS
}

function Column({ children, column, className }) {
  const showColumns = useColumns()
  return COLUMNS[column] ? (
    <div
      className={
        "column " + column + " " + (className || "")
      }
      style={{
        display: showColumns.includes(column)
          ? "block"
          : "none",
      }}
    >
      <h2>
        {COLUMNS[column].title || COLUMNS[column].label}
      </h2>
      <div className="content">{children}</div>
    </div>
  ) : null
}

function Toggle({ column }) {
  const showColumns = useColumns()
  const router = useRouter()
  return (
    <button
      onClick={() => {
        const newColumns = showColumns.includes(column)
          ? showColumns.filter(c => c !== column)
          : [...showColumns, column]

        const { demo, theme } = router.query
        const newRoute = {
          pathname: `/${demo}/${theme}`,
          query: {
            columns: newColumns.join(","),
          },
        }
        router.replace(newRoute, newRoute, {
          shallow: true,
        })
      }}
      className={
        showColumns.includes(column) ? "selected" : ""
      }
      style={{
        padding: "4px 8px",
      }}
    >
      {COLUMNS[column].label}
    </button>
  )
}

function MDXComponent({ code }) {
  const Component = React.useMemo(
    () => getMDXComponent(code, { react: React }),
    [code]
  )
  return <Component components={{ JSONView }} />
}

const BrowserReactJsonView = dynamic(
  () => import("react-json-view"),
  {
    ssr: false,
  }
)
function JSONView({ src }) {
  return (
    <BrowserReactJsonView
      src={JSON.parse(src)}
      enableClipboard={true}
      displayDataTypes={false}
      displayObjectSize={false}
      collapsed={4}
      collapseStringsAfterLength={12}
    />
  )
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { show: false, hasError: false }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    // console.log("getDerivedStateFromError", error)
    return {
      hasError: true,
      error: JSON.stringify(error, null, 2),
    }
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    // logErrorToMyService(error, errorInfo)
  }

  componentDidMount() {
    this.setState({ show: true })
  }

  render() {
    // ErrorBoundary doesn't work with SSR
    if (!this.state.show) {
      return ""
    }

    if (this.state.hasError) {
      return (
        <div>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error}</pre>
        </div>
      )
    }

    return this.props.children
  }
}
