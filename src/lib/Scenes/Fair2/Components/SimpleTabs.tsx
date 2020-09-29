import { useScreenDimensions } from "lib/utils/useScreenDimensions"
import { Box, color, Flex, Text } from "palette"
import React, { Dispatch, ReactElement, SetStateAction } from "react"
import { TouchableOpacity, View } from "react-native"

export type TabsType = Array<{
  label: string
  component: ReactElement
}>

interface TabChildContentProps {
  activeTab: number
  tabs: TabsType
}

/**
 * Each "tab" in the "tabs" array is an object containing a label and a
 * component reference. This method returns the component for the currently-active
 * tab.
 */
export const TabChildContent: React.FC<TabChildContentProps> = ({ activeTab, tabs }) => {
  const tabToShow = tabs ? tabs[activeTab] : null

  if (!tabToShow) {
    return null
  }

  return tabToShow.component
}

interface TabProps {
  label: string
  active: boolean
  onPress: () => void
}

/**
 * The render method for an individual tab. Will underline the currently
 * active tab.
 */
export const Tab: React.FC<TabProps> = ({ label, active, onPress }) => {
  const { safeAreaInsets } = useScreenDimensions()
  return (
    <TouchableOpacity onPress={onPress}>
      <View
        style={{
          marginTop: safeAreaInsets.top,
          height: 55,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 15,
        }}
      >
        <Text variant={active ? "mediumText" : "text"}>{label}</Text>
      </View>
    </TouchableOpacity>
  )
}

interface TabsProps {
  setActiveTab: Dispatch<SetStateAction<number>>
  activeTab: number
  tabs: TabsType
}

/**
 * Renders a list of tabs. Evenly-spaces them across the screen.
 */
export const Tabs: React.FC<TabsProps> = ({ setActiveTab, activeTab, tabs }) => {
  const tabWidth = 100 / tabs.length
  return (
    <Flex flexDirection="row" backgroundColor="white">
      {tabs.map(({ label }, index) => {
        const active = activeTab === index
        return (
          <Box
            width={`${tabWidth}%`}
            borderBottomColor={active ? color("black100") : color("black10")}
            borderBottomWidth="1px"
          >
            <Tab label={label} onPress={() => setActiveTab(index)} active={active} />
          </Box>
        )
      })}
    </Flex>
  )
}