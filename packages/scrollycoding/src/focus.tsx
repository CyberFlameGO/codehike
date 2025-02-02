import React from "react"
import {
  useHikeContext,
  FluidHikeContext,
} from "./hike-context"
import { useClasser } from "@code-hike/classer"
import { useStepData } from "./content-column"
import { EditorStep } from "@code-hike/mini-editor"

interface FocusProps {
  children?: React.ReactNode
  on: string
  file?: string
}

export { Focus, withFocusHandler, AnchorOrFocus }

function Focus({
  children,
  ...props
}: FocusProps): JSX.Element {
  const hikeContext = useHikeContext()
  return hikeContext.layout === "fixed" ? (
    (children as JSX.Element)
  ) : (
    <FocusButton
      context={hikeContext}
      children={children}
      {...props}
    />
  )
}

function FocusButton({
  children,
  on: focus,
  file,
  context,
}: FocusProps & { context: FluidHikeContext }) {
  const c = useClasser("ch-hike")
  const { dispatch, hikeState } = context

  const [stepIndex, newEditorStep] = useEditorStep(
    file,
    focus
  )
  const oldEditorStep = hikeState.focusEditorStep
  const isFocused = newEditorStep === oldEditorStep

  return (
    <button
      className={c(
        "focus",
        isFocused ? "focus-active" : "focus-inactive"
      )}
      title="Show code"
      onClick={e => {
        isFocused
          ? dispatch({ type: "reset-focus" })
          : dispatch({
              type: "set-focus",
              stepIndex,
              editorStep: newEditorStep,
            })
        e.stopPropagation()
      }}
    >
      {children}
      <Icon isFocused={isFocused} />
    </button>
  )
}

function Icon({ isFocused }: { isFocused: boolean }) {
  const c = useClasser("ch-hike")
  return (
    <svg
      fill="none"
      stroke="currentColor"
      className={c("focus-icon")}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={
          isFocused
            ? "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
            : "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
        }
      />
    </svg>
  )
}

function useEditorStep(
  file: string | undefined,
  focus: string
): [number, EditorStep] {
  // we merge the editor state from the step with the changes
  // requested by the Focus
  const { stepIndex, editorStep } = useStepData()
  return React.useMemo(() => {
    const fileName = file || editorStep.northPanel.active
    const fileIndex = editorStep.files.findIndex(
      f => f.name === fileName
    )
    const newFiles = editorStep.files.slice()
    newFiles[fileIndex] = { ...newFiles[fileIndex], focus }

    const newEditorStep = { ...editorStep, files: newFiles }

    const isInSouthPanel = editorStep.southPanel?.tabs.includes(
      fileName
    )

    if (isInSouthPanel) {
      newEditorStep.southPanel = {
        ...newEditorStep.southPanel!,
        active: fileName,
      }
    } else {
      newEditorStep.northPanel = {
        ...newEditorStep.northPanel,
        active: fileName,
      }
    }
    return [stepIndex, newEditorStep]
  }, [file, focus])
}

function withFocusHandler(type: any = "a") {
  function AnchorWithFocus(props: any) {
    return <AnchorOrFocus type={type} {...props} />
  }
  return AnchorWithFocus
}

function AnchorOrFocus({
  type = "a",
  href,
  ...props
}: any) {
  if (!href?.startsWith("focus://")) {
    return React.createElement(type, { href, ...props })
  }

  const [firstPart, secondPart] = decodeURI(href)
    .substr("focus://".length)
    .split("#")
  const hasFile = Boolean(secondPart)

  return hasFile ? (
    <Focus on={secondPart} file={firstPart} {...props} />
  ) : (
    <Focus on={firstPart} {...props} />
  )
}
