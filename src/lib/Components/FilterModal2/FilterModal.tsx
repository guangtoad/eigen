import { ContextModule } from "@artsy/cohesion"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator, StackScreenProps, TransitionPresets } from "@react-navigation/stack"
import { ArtworkFiltersStoreContext } from "lib/utils/ArtworkFilter2/ArtworkFiltersContext"

import { useSelectedOptionsDisplay } from "lib/utils/ArtworkFilter2/ArtworkFiltersStore"
import {
  changedFiltersParams,
  FilterArray,
  filterArtworksParams,
  FilterDisplayName,
  filterKeyFromAggregation,
  FilterParamName,
  FilterParams,
} from "lib/utils/ArtworkFilter2/FilterArtworksHelpers"
import { Schema } from "lib/utils/track"
import { OwnerEntityTypes, PageNames } from "lib/utils/track/schema"
import _ from "lodash"
import { ArrowRightIcon, Box, Button, CloseIcon, color, FilterIcon, Flex, Sans, Separator } from "palette"
import React from "react"
import { FlatList, TouchableOpacity, View, ViewProperties } from "react-native"
import { useTracking } from "react-tracking"
import styled from "styled-components/native"
import { selectedOption } from "../../utils/ArtworkFilter2/FilterArtworksHelpers"
import { AnimatedBottomButton } from "../AnimatedBottomButton"
// @ts-ignore
import { AdditionalGeneIDsOptionsScreen } from "../ArtworkFilterOptions/AdditionalGeneIDsOptions"
// @ts-ignore
import { ArtistIDsOptionsScreen } from "../ArtworkFilterOptions/ArtistIDsOptionsScreen"
// @ts-ignore
import { AttributionClassOptionsScreen } from "../ArtworkFilterOptions/AttributionClassOptions"
// @ts-ignore
import { CategoriesOptionsScreen } from "../ArtworkFilterOptions/CategoriesOptions"
// @ts-ignore
import { ColorOption, ColorOptionsScreen } from "../ArtworkFilterOptions/ColorOptions"
import { colorHexMap } from "../ArtworkFilterOptions/ColorSwatch"
// @ts-ignore
import { EstimateRangeOptionsScreen } from "../ArtworkFilterOptions/EstimateRangeOptions"
// @ts-ignore
import { GalleryOptionsScreen } from "../ArtworkFilterOptions/GalleryOptions"
// @ts-ignore
import { InstitutionOptionsScreen } from "../ArtworkFilterOptions/InstitutionOptions"
// @ts-ignore
import { MediumOptionsScreen } from "../ArtworkFilterOptions/MediumOptions"
// @ts-ignore
import { PriceRangeOptionsScreen } from "../ArtworkFilterOptions/PriceRangeOptions"
// @ts-ignore
import { SizeOptionsScreen } from "../ArtworkFilterOptions/SizeOptions"
// @ts-ignore
import { SizesOptionsScreen } from "../ArtworkFilterOptions/SizesOptions"
// @ts-ignore
import { SortOptionsScreen } from "../ArtworkFilterOptions/SortOptions"
// @ts-ignore
import { TimePeriodOptionsScreen } from "../ArtworkFilterOptions/TimePeriodOptions"
// @ts-ignore
import { ViewAsOptionsScreen } from "../ArtworkFilterOptions/ViewAsOptions"
// @ts-ignore
import { WaysToBuyOptionsScreen } from "../ArtworkFilterOptions/WaysToBuyOptions"
// @ts-ignore
import { YearOptionsScreen } from "../ArtworkFilterOptions/YearOptions"
import { FancyModal } from "../FancyModal/FancyModal"

export type FilterScreen =
  | "additionalGeneIDs"
  | "artistIDs"
  | "artistsIFollow"
  | "attributionClass"
  | "categories"
  | "color"
  | "dimensionRange"
  | "estimateRange"
  | "gallery"
  | "institution"
  | "majorPeriods"
  | "medium"
  | "priceRange"
  | "sizes"
  | "sort"
  | "viewAs"
  | "waysToBuy"
  | "year"

export interface FilterDisplayConfig {
  filterType: FilterScreen
  displayText: string
  ScreenComponent: keyof FilterModalNavigationStack
}

export enum FilterModalMode {
  ArtistArtworks = "ArtistArtworks",
  ArtistSeries = "ArtistSeries",
  AuctionResults = "AuctionResults",
  Collection = "Collection",
  Fair = "Fair",
  Partner = "Partner",
  SaleArtworks = "SaleArtworks",
  Show = "Show",
}

interface FilterModalProps extends ViewProperties {
  closeModal?: () => void
  exitModal?: () => void
  id: string
  initiallyAppliedFilters?: FilterArray
  isFilterArtworksModalVisible: boolean
  mode: FilterModalMode
  slug: string
  title?: string
}

// This needs to be a `type` rather than an `interface`
// see src/lib/Scenes/MyCollection/Screens/ArtworkFormModal/MyCollectionArtworkFormModal.tsx#L35
// tslint:disable-next-line:interface-over-type-literal
export type FilterModalNavigationStack = {
  AdditionalGeneIDsOptionsScreen: undefined
  ArtistIDsOptionsScreen: undefined
  AttributionClassOptionsScreen: undefined
  CategoriesOptionsScreen: undefined
  ColorOptionsScreen: undefined
  EstimateRangeOptionsScreen: undefined
  FilterOptionsScreen: FilterOptionsScreenParams
  GalleryOptionsScreen: undefined
  InstitutionOptionsScreen: undefined
  MediumOptionsScreen: undefined
  PriceRangeOptionsScreen: undefined
  SizeOptionsScreen: undefined
  SizesOptionsScreen: undefined
  SortOptionsScreen: undefined
  TimePeriodOptionsScreen: undefined
  ViewAsOptionsScreen: undefined
  WaysToBuyOptionsScreen: undefined
  YearOptionsScreen: undefined
}

const Stack = createStackNavigator<FilterModalNavigationStack>()

export const FilterModalNavigator: React.FC<FilterModalProps> = (props) => {
  const tracking = useTracking()
  const { exitModal, id, mode, slug, closeModal } = props

  const appliedFiltersState = ArtworkFiltersStoreContext.useStoreState((state) => state.appliedFilters)
  const selectedFiltersState = ArtworkFiltersStoreContext.useStoreState((state) => state.selectedFilters)
  const previouslyAppliedFiltersState = ArtworkFiltersStoreContext.useStoreState(
    (state) => state.previouslyAppliedFilters
  )
  const filterTypeState = ArtworkFiltersStoreContext.useStoreState((state) => state.filterType)

  const applyFiltersAction = ArtworkFiltersStoreContext.useStoreActions((action) => action.applyFiltersAction)
  const resetFiltersAction = ArtworkFiltersStoreContext.useStoreActions((action) => action.resetFiltersAction)

  const handleClosingModal = () => {
    resetFiltersAction()
    closeModal?.()
  }

  const applyFilters = () => {
    applyFiltersAction()
    exitModal?.()
  }

  const trackChangeFilters = ({
    changedParams,
    contextModule,
    currentParams,
    ownerEntity,
    screenName,
  }: {
    changedParams: any
    contextModule?: ContextModule
    currentParams: FilterParams
    ownerEntity: OwnerEntityTypes
    screenName: PageNames
  }) => {
    tracking.trackEvent({
      context_module: contextModule,
      context_screen: screenName,
      context_screen_owner_type: ownerEntity,
      context_screen_owner_id: id,
      context_screen_owner_slug: slug,
      current: currentParams,
      changed: changedParams,
      action_type: Schema.ActionTypes.ChangeFilterParams,
    })
  }

  const getApplyButtonCount = () => {
    let selectedFiltersSum = selectedFiltersState.length

    // For Auction results, the earliestCreatedYear and latestCreatedYear filters behave like one
    if (filterTypeState === "auctionResult") {
      const hasEarliestCreatedYearFilterEnabled = !!selectedFiltersState.find(
        (filter) => filter.paramName === FilterParamName.earliestCreatedYear
      )
      const hasLatestCreatedYearFilterEnabled = !!selectedFiltersState.find(
        (filter) => filter.paramName === FilterParamName.latestCreatedYear
      )
      if (hasEarliestCreatedYearFilterEnabled && hasLatestCreatedYearFilterEnabled) {
        --selectedFiltersSum
      }
    }

    // For Sale Artworks, the artistsIDs and the includeArtworksByFollowedArtists filters behave like one
    if (filterTypeState === "saleArtwork") {
      const hasArtistsIFollow = !!selectedFiltersState.find(
        (filter) => filter.paramName === FilterParamName.artistsIFollow
      )
      const hasArtistIDs = !!selectedFiltersState.find((filter) => filter.paramName === FilterParamName.artistIDs)

      if (hasArtistIDs && hasArtistsIFollow) {
        --selectedFiltersSum
      }
    }
    return selectedFiltersSum > 0 ? `Apply (${selectedFiltersSum})` : "Apply"
  }

  const isApplyButtonEnabled =
    selectedFiltersState.length > 0 || (previouslyAppliedFiltersState.length === 0 && appliedFiltersState.length > 0)

  return (
    <NavigationContainer independent>
      <FancyModal visible={props.isFilterArtworksModalVisible} onBackgroundPressed={handleClosingModal} maxHeight={550}>
        <View style={{ flex: 1 }}>
          <Stack.Navigator
            // force it to not use react-native-screens, which is broken inside a react-native Modal for some reason
            detachInactiveScreens={false}
            screenOptions={{
              ...TransitionPresets.SlideFromRightIOS,
              headerShown: false,
              safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
              cardStyle: { backgroundColor: "white" },
            }}
          >
            <Stack.Screen name="FilterOptionsScreen" component={FilterOptionsScreen} initialParams={props} />
            {/* <Stack.Screen name="ArtistIDsOptionsScreen" component={ArtistIDsOptionsScreen} />
            <Stack.Screen name="AttributionClassOptionsScreen" component={AttributionClassOptionsScreen} />
            <Stack.Screen name="ColorOptionsScreen" component={ColorOptionsScreen} />
            <Stack.Screen name="EstimateRangeOptionsScreen" component={EstimateRangeOptionsScreen} />
            <Stack.Screen name="GalleryOptionsScreen" component={GalleryOptionsScreen} />
            <Stack.Screen name="AdditionalGeneIDsOptionsScreen" component={AdditionalGeneIDsOptionsScreen} />
            <Stack.Screen name="InstitutionOptionsScreen" component={InstitutionOptionsScreen} />
            <Stack.Screen name="MediumOptionsScreen" component={MediumOptionsScreen} />
            <Stack.Screen name="PriceRangeOptionsScreen" component={PriceRangeOptionsScreen} />
            <Stack.Screen name="SizeOptionsScreen" component={SizeOptionsScreen} />
            <Stack.Screen name="SizesOptionsScreen" component={SizesOptionsScreen} />
            <Stack.Screen name="SortOptionsScreen" component={SortOptionsScreen} />
            <Stack.Screen name="TimePeriodOptionsScreen" component={TimePeriodOptionsScreen} /> */}
            <Stack.Screen name="ViewAsOptionsScreen" component={ViewAsOptionsScreen} />
            {/* <Stack.Screen
              name="YearOptionsScreen"
              component={YearOptionsScreen}
              options={{
                // Avoid PanResponser conflicts between the slider and the slide back gesture
                gestureEnabled: false,
              }}
            />
            <Stack.Screen name="WaysToBuyOptionsScreen" component={WaysToBuyOptionsScreen} />
            <Stack.Screen name="CategoriesOptionsScreen" component={CategoriesOptionsScreen} /> */}
          </Stack.Navigator>

          <Separator my={0} />
          <ApplyButtonContainer>
            <ApplyButton
              disabled={!isApplyButtonEnabled}
              onPress={() => {
                const appliedFiltersParams = filterArtworksParams(appliedFiltersState, filterTypeState)
                // TODO: Update to use cohesion
                switch (mode) {
                  case FilterModalMode.Collection:
                    trackChangeFilters({
                      screenName: PageNames.Collection,
                      ownerEntity: OwnerEntityTypes.Collection,
                      currentParams: appliedFiltersParams,
                      changedParams: changedFiltersParams(appliedFiltersParams, selectedFiltersState),
                    })
                    break
                  case FilterModalMode.ArtistArtworks:
                    trackChangeFilters({
                      screenName: PageNames.ArtistPage,
                      ownerEntity: OwnerEntityTypes.Artist,
                      currentParams: appliedFiltersParams,
                      changedParams: changedFiltersParams(appliedFiltersParams, selectedFiltersState),
                    })
                    break
                  case FilterModalMode.Fair:
                    trackChangeFilters({
                      screenName: PageNames.FairPage,
                      ownerEntity: OwnerEntityTypes.Fair,
                      currentParams: appliedFiltersParams,
                      changedParams: changedFiltersParams(appliedFiltersParams, selectedFiltersState),
                    })
                    break
                  case FilterModalMode.SaleArtworks:
                    trackChangeFilters({
                      screenName: PageNames.Auction,
                      ownerEntity: OwnerEntityTypes.Auction,
                      currentParams: appliedFiltersParams,
                      changedParams: changedFiltersParams(appliedFiltersParams, selectedFiltersState),
                    })
                    break
                  case FilterModalMode.Show:
                    trackChangeFilters({
                      screenName: PageNames.ShowPage,
                      ownerEntity: OwnerEntityTypes.Show,
                      currentParams: appliedFiltersParams,
                      changedParams: changedFiltersParams(appliedFiltersParams, selectedFiltersState),
                    })
                    break
                  case FilterModalMode.AuctionResults:
                    trackChangeFilters({
                      screenName: PageNames.ArtistPage,
                      ownerEntity: OwnerEntityTypes.Artist,
                      currentParams: appliedFiltersParams,
                      changedParams: changedFiltersParams(appliedFiltersParams, selectedFiltersState),
                      contextModule: ContextModule.auctionResults,
                    })
                    break

                  case FilterModalMode.Partner:
                    trackChangeFilters({
                      screenName: PageNames.PartnerPage,
                      ownerEntity: OwnerEntityTypes.Partner,
                      currentParams: appliedFiltersParams,
                      changedParams: changedFiltersParams(appliedFiltersParams, selectedFiltersState),
                    })
                    break
                }
                applyFilters()
              }}
              block
              width={100}
              variant="primaryBlack"
              size="large"
            >
              {getApplyButtonCount()}
            </ApplyButton>
          </ApplyButtonContainer>
        </View>
      </FancyModal>
    </NavigationContainer>
  )
}

interface FilterOptionsScreenParams {
  closeModal: () => void
  exitModal: () => void
  id: string
  initiallyAppliedFilters?: FilterArray
  mode: FilterModalMode
  slug: string
  title?: string
}

export const FilterOptionsScreen: React.FC<StackScreenProps<FilterModalNavigationStack, "FilterOptionsScreen">> = ({
  navigation,
  route,
}) => {
  const tracking = useTracking()
  const { closeModal, id, mode, slug, title = "Filter" } = route.params

  const appliedFiltersState = ArtworkFiltersStoreContext.useStoreState((state) => state.appliedFilters)
  const selectedFiltersState = ArtworkFiltersStoreContext.useStoreState((state) => state.selectedFilters)
  const aggregationsState = ArtworkFiltersStoreContext.useStoreState((state) => state.aggregations)
  const filterTypeState = ArtworkFiltersStoreContext.useStoreState((state) => state.filterType)

  const clearAllAction = ArtworkFiltersStoreContext.useStoreActions((action) => action.clearAllAction)

  const selectedOptions = useSelectedOptionsDisplay()

  const navigateToNextFilterScreen = (screenName: keyof FilterModalNavigationStack) => {
    navigation.navigate(screenName)
  }

  const concreteAggregations = aggregationsState ?? []

  const isClearAllButtonEnabled = appliedFiltersState.length > 0 || selectedFiltersState.length > 0

  const aggregateFilterOptions: FilterDisplayConfig[] = _.compact(
    concreteAggregations.map((aggregation) => {
      const filterOption = filterKeyFromAggregation[aggregation.slice]
      return filterOption ? filterOptionToDisplayConfigMap[filterOption] : null
    })
  )

  const filterOptions: FilterDisplayConfig[] = getStaticFilterOptionsByMode(mode).concat(aggregateFilterOptions)

  const sortedFilterOptions = filterOptions
    .sort(getFilterScreenSortByMode(mode))
    .filter((filterOption) => filterOption.filterType)

  const clearAllFilters = () => {
    clearAllAction()
  }

  const trackClear = (screenName: PageNames, ownerEntity: OwnerEntityTypes) => {
    tracking.trackEvent({
      action_name: "clearFilters",
      context_screen: screenName,
      context_screen_owner_type: ownerEntity,
      context_screen_owner_id: id,
      context_screen_owner_slug: slug,
      action_type: Schema.ActionTypes.Tap,
    })
  }

  const handleTappingCloseIcon = () => {
    closeModal()
  }

  return (
    <Flex style={{ flex: 1 }}>
      <Flex flexGrow={0} flexDirection="row" justifyContent="space-between">
        <Flex position="absolute" width="100%" height={67} justifyContent="center" alignItems="center">
          <Sans size="4" weight="medium">
            {title}
          </Sans>
        </Flex>
        <Flex alignItems="flex-end" mt={0.5} mb={2}>
          <CloseIconContainer hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} onPress={handleTappingCloseIcon}>
            <CloseIcon fill="black100" />
          </CloseIconContainer>
        </Flex>
        <ClearAllButton
          disabled={!isClearAllButtonEnabled}
          onPress={() => {
            switch (mode) {
              case FilterModalMode.Collection:
                trackClear(PageNames.Collection, OwnerEntityTypes.Collection)
                break
              case FilterModalMode.ArtistArtworks:
                trackClear(PageNames.ArtistPage, OwnerEntityTypes.Artist)
                break
              case FilterModalMode.ArtistSeries:
                trackClear(PageNames.ArtistSeriesPage, OwnerEntityTypes.ArtistSeries)
                break
              case "Fair":
                trackClear(PageNames.FairPage, OwnerEntityTypes.Fair)
                break
            }

            clearAllFilters()
          }}
        >
          <Sans mr={2} mt={2} size="4" color={isClearAllButtonEnabled ? "black100" : "black30"}>
            Clear all
          </Sans>
        </ClearAllButton>
      </Flex>
      <Separator />
      <FlatList<FilterDisplayConfig>
        keyExtractor={(_item, index) => String(index)}
        data={sortedFilterOptions}
        style={{ flexGrow: 1 }}
        ItemSeparatorComponent={() => <Separator />}
        renderItem={({ item }) => {
          return (
            <Box>
              <TouchableOptionListItemRow onPress={() => navigateToNextFilterScreen(item.ScreenComponent)}>
                <OptionListItem>
                  <Flex p={2} pr="15px" flexDirection="row" justifyContent="space-between" flexGrow={1}>
                    <Flex flex={1}>
                      <Sans size="3t" color="black100">
                        {item.displayText}
                      </Sans>
                    </Flex>
                    <Flex flexDirection="row" alignItems="center" justifyContent="flex-end" flex={1}>
                      <OptionDetail
                        currentOption={selectedOption({
                          selectedOptions,
                          filterScreen: item.filterType,
                          filterType: filterTypeState,
                          aggregations: aggregationsState,
                        })}
                        filterType={item.filterType}
                      />
                      <ArrowRightIcon fill="black30" ml="1" />
                    </Flex>
                  </Flex>
                </OptionListItem>
              </TouchableOptionListItemRow>
            </Box>
          )
        }}
      />
    </Flex>
  )
}

export const getStaticFilterOptionsByMode = (mode: FilterModalMode) => {
  switch (mode) {
    case FilterModalMode.SaleArtworks:
      return [
        filterOptionToDisplayConfigMap.sort,
        filterOptionToDisplayConfigMap.viewAs,
        filterOptionToDisplayConfigMap.estimateRange,
      ]

    case FilterModalMode.AuctionResults:
      return [
        filterOptionToDisplayConfigMap.sort,
        filterOptionToDisplayConfigMap.categories,
        filterOptionToDisplayConfigMap.sizes,
        filterOptionToDisplayConfigMap.year,
      ]

    default:
      return [
        filterOptionToDisplayConfigMap.sort,
        filterOptionToDisplayConfigMap.waysToBuy,
        filterOptionToDisplayConfigMap.attributionClass,
      ]
  }
}

export const getFilterScreenSortByMode = (mode: FilterModalMode) => (
  left: FilterDisplayConfig,
  right: FilterDisplayConfig
): number => {
  let sortOrder: FilterScreen[] = []

  // Filter order is based on frequency of use for a given page
  switch (mode) {
    case FilterModalMode.Collection:
      sortOrder = CollectionFiltersSorted
      break
    case FilterModalMode.ArtistArtworks:
      sortOrder = ArtistArtworksFiltersSorted
      break
    case FilterModalMode.ArtistSeries:
      sortOrder = ArtistSeriesFiltersSorted
      break
    case FilterModalMode.Show:
    case FilterModalMode.Fair:
      sortOrder = FairFiltersSorted
      break
    case FilterModalMode.SaleArtworks:
      sortOrder = SaleArtworksFiltersSorted
      break
    case FilterModalMode.AuctionResults:
      sortOrder = AuctionResultsFiltersSorted
      break
    case FilterModalMode.Partner:
      sortOrder = [
        "sort",
        "medium",
        "attributionClass",
        "priceRange",
        "waysToBuy",
        "dimensionRange",
        "majorPeriods",
        "color",
      ]
      break
  }

  const leftParam = left.filterType
  const rightParam = right.filterType
  if (sortOrder.indexOf(leftParam) < sortOrder.indexOf(rightParam)) {
    return -1
  } else {
    return 1
  }
}

const OptionDetail: React.FC<{ currentOption: any; filterType: any }> = ({ currentOption, filterType }) => {
  if (filterType === FilterParamName.color && currentOption !== "All") {
    return <ColorSwatch colorOption={currentOption} />
  } else {
    return (
      <CurrentOption size="3t" ellipsizeMode="tail" numberOfLines={1}>
        {currentOption}
      </CurrentOption>
    )
  }
}

const ColorSwatch: React.FC<{ colorOption: ColorOption }> = ({ colorOption }) => {
  return (
    <Box
      mr={0.3}
      style={{
        alignSelf: "center",
        width: 10,
        height: 10,
        borderRadius: 10 / 2,
        backgroundColor: colorHexMap[colorOption],
      }}
    />
  )
}

export const FilterHeader = styled(Sans)`
  margin-top: 20px;
  padding-left: 35px;
`

export const FilterArtworkButton = styled(Flex)`
  background-color: ${color("black100")};
  align-items: center;
  justify-content: center;
  flex-direction: row;
  box-shadow: 0px 3px 3px rgba(0, 0, 0, 0.12);
`

interface AnimatedArtworkFilterButtonProps {
  isVisible: boolean
  onPress: () => void
  text?: string
}
export const AnimatedArtworkFilterButton: React.FC<AnimatedArtworkFilterButtonProps> = ({
  isVisible,
  onPress,
  text = "Sort & Filter",
}) => {
  const appliedFiltersState = ArtworkFiltersStoreContext.useStoreState((state) => state.appliedFilters)
  const filterTypeState = ArtworkFiltersStoreContext.useStoreState((state) => state.filterType)

  const getFiltersCount = () => {
    let selectedFiltersSum = appliedFiltersState.length

    // the earliest created year and the latest created year are different fileters but they behave as one
    // therefore we need to decrement the number of filters by one when they are active
    if (filterTypeState === "auctionResult") {
      const hasEarliestCreatedYearFilterEnabled = !!appliedFiltersState.find(
        (filter) => filter.paramName === FilterParamName.earliestCreatedYear
      )
      const hasLatestCreatedYearFilterEnabled = !!appliedFiltersState.find(
        (filter) => filter.paramName === FilterParamName.latestCreatedYear
      )

      if (hasEarliestCreatedYearFilterEnabled || hasLatestCreatedYearFilterEnabled) {
        --selectedFiltersSum
      }
    }
    // For Sale Artworks, the artistsIDs and the includeArtworksByFollowedArtists filters behave like one
    // Therefore we need to decrement the number of filters by one to give the user the impression they are one
    if (filterTypeState === "saleArtwork") {
      const hasArtistsIFollow = !!appliedFiltersState.find(
        (filter) => filter.paramName === FilterParamName.artistsIFollow
      )
      const hasArtistIDs = !!appliedFiltersState.find((filter) => filter.paramName === FilterParamName.artistIDs)

      if (hasArtistIDs && hasArtistsIFollow) {
        --selectedFiltersSum
      }
    }
    return selectedFiltersSum
  }

  const roundedButtonStyle = { borderRadius: 20 }

  return (
    <AnimatedBottomButton isVisible={isVisible} onPress={onPress} buttonStyles={roundedButtonStyle}>
      <FilterArtworkButton px="2" style={roundedButtonStyle}>
        <FilterIcon fill="white100" />
        <Sans size="3t" pl="1" py="1" color="white100" weight="medium">
          {text}
        </Sans>
        {getFiltersCount() > 0 && (
          <>
            <Sans size="3t" pl={0.5} py="1" color="white100" weight="medium">
              {"\u2022"}
            </Sans>
            <Sans size="3t" pl={0.5} py="1" color="white100" weight="medium">
              {getFiltersCount()}
            </Sans>
          </>
        )}
      </FilterArtworkButton>
    </AnimatedBottomButton>
  )
}

export const TouchableOptionListItemRow = styled(TouchableOpacity)``

export const CloseIconContainer = styled(TouchableOpacity)`
  margin: 20px 0px 0px 20px;
`

export const OptionListItem = styled(Flex)`
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
`

export const CurrentOption = styled(Sans)`
  color: ${color("black60")};
`
export const ClearAllButton = styled(TouchableOpacity)``
export const ApplyButton = styled(Button)``
export const ApplyButtonContainer = styled(Box)`
  padding: 20px;
  padding-bottom: 30px;
`

export const filterOptionToDisplayConfigMap: Record<string, FilterDisplayConfig> = {
  additionalGeneIDs: {
    displayText: FilterDisplayName.additionalGeneIDs,
    filterType: "additionalGeneIDs",
    ScreenComponent: "AdditionalGeneIDsOptionsScreen",
  },
  artistIDs: {
    displayText: FilterDisplayName.artistIDs,
    filterType: "artistIDs",
    ScreenComponent: "ArtistIDsOptionsScreen",
  },
  attributionClass: {
    displayText: FilterDisplayName.attributionClass,
    filterType: "attributionClass",
    ScreenComponent: "AttributionClassOptionsScreen",
  },
  color: {
    displayText: FilterDisplayName.color,
    filterType: "color",
    ScreenComponent: "ColorOptionsScreen",
  },
  categories: {
    displayText: FilterDisplayName.categories,
    filterType: "categories",
    ScreenComponent: "CategoriesOptionsScreen",
  },
  dimensionRange: {
    displayText: FilterDisplayName.size,
    filterType: "dimensionRange",
    ScreenComponent: "SizeOptionsScreen",
  },
  estimateRange: {
    displayText: FilterDisplayName.estimateRange,
    filterType: "estimateRange",
    ScreenComponent: "EstimateRangeOptionsScreen",
  },
  gallery: {
    displayText: FilterDisplayName.gallery,
    filterType: "gallery",
    ScreenComponent: "GalleryOptionsScreen",
  },
  institution: {
    displayText: FilterDisplayName.institution,
    filterType: "institution",
    ScreenComponent: "InstitutionOptionsScreen",
  },
  majorPeriods: {
    displayText: FilterDisplayName.timePeriod,
    filterType: "majorPeriods",
    ScreenComponent: "TimePeriodOptionsScreen",
  },
  medium: {
    displayText: FilterDisplayName.medium,
    filterType: "medium",
    ScreenComponent: "MediumOptionsScreen",
  },
  priceRange: {
    displayText: FilterDisplayName.priceRange,
    filterType: "priceRange",
    ScreenComponent: "PriceRangeOptionsScreen",
  },
  sort: {
    displayText: FilterDisplayName.sort,
    filterType: "sort",
    ScreenComponent: "SortOptionsScreen",
  },
  sizes: {
    displayText: FilterDisplayName.sizes,
    filterType: "sizes",
    ScreenComponent: "SizesOptionsScreen",
  },
  viewAs: {
    displayText: FilterDisplayName.viewAs,
    filterType: "viewAs",
    ScreenComponent: "ViewAsOptionsScreen",
  },
  year: {
    displayText: FilterDisplayName.year,
    filterType: "year",
    ScreenComponent: "YearOptionsScreen",
  },
  waysToBuy: {
    displayText: FilterDisplayName.waysToBuy,
    filterType: "waysToBuy",
    ScreenComponent: "WaysToBuyOptionsScreen",
  },
}

const CollectionFiltersSorted: FilterScreen[] = [
  "sort",
  "medium",
  "additionalGeneIDs",
  "attributionClass",
  "priceRange",
  "waysToBuy",
  "dimensionRange",
  "majorPeriods",
  "color",
  "gallery",
  "institution",
]
const ArtistArtworksFiltersSorted: FilterScreen[] = [
  "sort",
  "medium",
  "additionalGeneIDs",
  "attributionClass",
  "priceRange",
  "waysToBuy",
  "gallery",
  "institution",
  "dimensionRange",
  "majorPeriods",
  "color",
]
const ArtistSeriesFiltersSorted: FilterScreen[] = [
  "sort",
  "medium",
  "additionalGeneIDs",
  "attributionClass",
  "priceRange",
  "waysToBuy",
  "dimensionRange",
  "majorPeriods",
  "color",
  "gallery",
  "institution",
]
const FairFiltersSorted: FilterScreen[] = [
  "sort",
  "artistIDs",
  "artistsIFollow",
  "medium",
  "additionalGeneIDs",
  "attributionClass",
  "priceRange",
  "waysToBuy",
  "dimensionRange",
  "majorPeriods",
  "color",
  "gallery",
  "institution",
]
const SaleArtworksFiltersSorted: FilterScreen[] = [
  "sort",
  "viewAs",
  "estimateRange",
  "artistIDs",
  "medium",
  "additionalGeneIDs",
]

const AuctionResultsFiltersSorted: FilterScreen[] = ["sort", "categories", "sizes", "year"]