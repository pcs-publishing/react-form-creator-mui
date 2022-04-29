import React, { createContext, useState, useEffect, useMemo } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import { assign, cloneDeep } from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import { Tool, ToolInstance, FormStructure } from 'types/index'
import generateLabelForFieldName from 'utils/generateLabelForFieldName'
import ToolNameDialog from 'components/FormEditor/components/ToolNameDialog'
import getToolInstanceByName from 'utils/getToolInstanceByName'

interface ToolContextExport {
  tools: Tool<any>[]
  toolInstances: ToolInstance<any>[]
  selectedToolInstance: ToolInstance<any> | null
  createToolInstance: (tool: Tool<any>, index?: number, parent?: string) => void
  removeToolInstance: (instance: ToolInstance<any>) => void
  moveToolInstance: (toolInstanceName: string, newIndex: number) => void
  updateToolInstance: (instance: ToolInstance<any>) => void
  selectToolInstance: (toolInstance: ToolInstance<any>) => void
  clearSelectedToolInstance: () => void
}

interface ToolContentImport<T extends FormStructure> {
  tools: Tool<any>[]
  initialValue: T
  children: React.ReactChild
}

const ToolContext = createContext<ToolContextExport | null>(null)

const ToolContextProvider = <T extends FormStructure>(
  props: ToolContentImport<T>
) => {
  const { children, tools, initialValue } = props
  const initialItems = initialValue.items
  const [toolInstances, setToolInstances] = useState<ToolInstance<any>[]>(
    formatInputItemsToToolInstances(initialItems, tools)
  )
  const [selectedToolInstanceName, setSelectedToolInstanceName] = useState<
    string | null
  >(null)
  const [pendingAddTool, setPendingAddTool] = useState<{
    tool: Tool<any>
    index?: number
    parent?: string
  } | null>(null)

  // If the default tool instances change, then we should update the tool instances
  useEffect(
    () =>
      setToolInstances(formatInputItemsToToolInstances(initialItems, tools)),
    [initialItems, setToolInstances, tools]
  )

  const createToolInstance = (
    tool: Tool<any>,
    index?: number,
    parent?: string
  ) => {
    if (tool.requireName === false) {
      addToolInstance(
        { ...tool, parent, name: generateToolName() },
        index,
        parent
      )
      return
    }

    setPendingAddTool({ tool, index, parent })
  }

  const addToolInstance = (
    toolInstanceInput: Omit<ToolInstance<any>, 'children'>,
    index?: number,
    parent?: string
  ) => {
    console.log('addToolInstance', toolInstanceInput, index, parent)
    if (toolInstances.find((t) => t.name === toolInstanceInput.name)) {
      return `There is already a tool with the name ${toolInstanceInput.name}`
    }
    if (tools.find((t) => t.toolType === toolInstanceInput.name)) {
      return `The name "${toolInstanceInput.name}" is reserved and can not be used`
    }

    const toolInstance = { ...toolInstanceInput, children: [] }

    if (toolInstance.options.label) {
      toolInstance.options.label = generateLabelForFieldName(toolInstance.name)
    }
    if (!toolInstance.children) {
      toolInstance.children = []
    }
    if (parent) {
      toolInstance.parent = parent
    }

    setToolInstances((toolInstances) => {
      if (parent) {
        const newToolInstances = cloneDeep(toolInstances)
        const parentToolInstance = getToolInstanceByName(
          parent,
          newToolInstances
        )

        const insertAt = Math.min(
          index || Number.MAX_SAFE_INTEGER,
          parentToolInstance.children.length
        )
        parentToolInstance.children.splice(insertAt, 0, toolInstance)

        console.log('newToolInstances', newToolInstances)

        return newToolInstances
      }

      const newToolInstances = cloneDeep(toolInstances)
      const insertAt = index || newToolInstances.length
      newToolInstances.splice(insertAt, 0, toolInstance)
      return newToolInstances
    })

    setSelectedToolInstanceName(toolInstance.name)

    return true
  }

  const removeToolInstance = (instance: ToolInstance<any>) => {
    const toolInstanceToRemove = getToolInstanceByName(
      instance.name,
      toolInstances
    )

    setSelectedToolInstanceName(null)

    setToolInstances((toolInstances) => {
      if (toolInstanceToRemove.parent) {
        const newToolInstances = cloneDeep(toolInstances)
        const parentToolInstance = getToolInstanceByName(
          toolInstanceToRemove.parent,
          newToolInstances
        )
        parentToolInstance.children = parentToolInstance.children.filter(
          (t) => t.name !== instance.name
        )
        return newToolInstances
      }
      return toolInstances.filter((i) => i.name !== instance.name)
    })
  }

  const moveToolInstance = (toolInstanceName: string, newIndex: number) => {
    setToolInstances((toolInstances) => {
      const toolInstance = getToolInstanceByName(
        toolInstanceName,
        toolInstances
      )
      const newToolInstances = cloneDeep(toolInstances)

      if (toolInstance.parent) {
        const parent = getToolInstanceByName(
          toolInstance.parent,
          newToolInstances
        )
        const oldIndex = parent.children.findIndex(
          (t) => t.name === toolInstanceName
        )

        parent.children = arrayMove(parent.children, oldIndex, newIndex)
        return newToolInstances
      } else {
        const oldIndex = toolInstances.findIndex(
          (instance) => instance.name === toolInstanceName
        )
        return arrayMove(toolInstances, oldIndex, newIndex)
      }
    })
  }

  const updateToolInstance = (instance: ToolInstance<any>) => {
    setToolInstances((toolInstances) => {
      const newToolInstances = cloneDeep(toolInstances)
      const toolInstance = getToolInstanceByName(
        instance.name,
        newToolInstances
      )

      assign(toolInstance, instance)

      return newToolInstances
    })
  }

  const selectToolInstance = (toolInstance: ToolInstance<any>) => {
    setSelectedToolInstanceName(toolInstance.name)
  }

  const getSelectedToolInstance = () => {
    let selectedToolInstance: ToolInstance<any> | null = null

    if (selectedToolInstanceName) {
      selectedToolInstance = getToolInstanceByName(
        selectedToolInstanceName,
        toolInstances
      )
    }

    return selectedToolInstance
  }

  const selectedToolInstance = getSelectedToolInstance()

  const clearSelectedToolInstance = () => {
    setSelectedToolInstanceName(null)
  }

  const exposed = {
    tools,
    toolInstances,
    createToolInstance,
    removeToolInstance,
    moveToolInstance,
    updateToolInstance,
    selectedToolInstance,
    selectToolInstance,
    clearSelectedToolInstance
  }

  return (
    <ToolContext.Provider value={exposed}>
      <ToolNameDialog
        pendingTool={pendingAddTool}
        onAdd={addToolInstance}
        onClose={() => setPendingAddTool(null)}
      />
      {children}
    </ToolContext.Provider>
  )
}

export const useTools = () => {
  const context = React.useContext(ToolContext)
  if (!context) {
    throw new Error('useTools must be used within a ToolContextProvider')
  }
  return context
}

function formatInputItemsToToolInstances(
  items: FormStructure['items'],
  tools: Tool<any>[]
): ToolInstance<any>[] {
  return items.map((item) => {
    const tool = tools.find((t) => t.toolType === item.toolType)
    if (!tool) {
      throw new Error(`Could not find tool for type ${item.toolType}`)
    }
    return {
      ...tool,
      name: item.name,
      children: formatInputItemsToToolInstances(
        items.filter((item) => item.parent === item.name),
        tools
      ),
      options: {
        ...tool.options,
        ...item.options
      }
    }
  })
}

function generateToolName(): string {
  return uuidv4()
}

export default ToolContextProvider