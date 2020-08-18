import { Flex } from "@artsy/palette"
import { ArtistSeriesFullArtistSeriesList_artist } from "__generated__/ArtistSeriesFullArtistSeriesList_artist.graphql"
import { ArtistSeriesFullArtistSeriesListQuery } from "__generated__/ArtistSeriesFullArtistSeriesListQuery.graphql"
import { PageWithSimpleHeader } from "lib/Components/PageWithSimpleHeader"
import { defaultEnvironment } from "lib/relay/createEnvironment"
import { ArtistSeriesListItem } from "lib/Scenes/ArtistSeries/ArtistSeriesListItem"
import renderWithLoadProgress from "lib/utils/renderWithLoadProgress"
import React from "react"
import { ScrollView } from "react-native"
import { createFragmentContainer, graphql, QueryRenderer } from "react-relay"

interface FullArtistSeriesListProps {
  artist: ArtistSeriesFullArtistSeriesList_artist
}

export const FullArtistSeriesList: React.FC<FullArtistSeriesListProps> = ({ artist }) => {
  const seriesList = artist?.artistSeriesConnection?.edges ?? []

  if (!artist || seriesList.length === 0) {
    return null
  }

  return (
    <PageWithSimpleHeader title="Artist Series" noSeparator>
      <ScrollView style={{ marginTop: 30 }}>
        {seriesList.map((series, index) => (
          <Flex key={series?.node?.internalID ?? index} flexDirection="row" mb={1} px={2}>
            <ArtistSeriesListItem listItem={series} />
          </Flex>
        ))}
      </ScrollView>
    </PageWithSimpleHeader>
  )
}

export const ArtistSeriesFullArtistSeriesListFragmentContainer = createFragmentContainer(FullArtistSeriesList, {
  artist: graphql`
    fragment ArtistSeriesFullArtistSeriesList_artist on Artist {
      artistSeriesConnection {
        edges {
          node {
            slug
            internalID
            title
            artworksCountMessage
            image {
              url
            }
          }
        }
      }
    }
  `,
})

export const ArtistSeriesFullArtistSeriesListQueryRenderer: React.SFC<{ artistID: string }> = ({ artistID }) => {
  return (
    <QueryRenderer<ArtistSeriesFullArtistSeriesListQuery>
      environment={defaultEnvironment}
      query={graphql`
        query ArtistSeriesFullArtistSeriesListQuery($artistID: String!) {
          artist(id: $artistID) {
            ...ArtistSeriesFullArtistSeriesList_artist
          }
        }
      `}
      cacheConfig={{ force: true }}
      variables={{
        artistID,
      }}
      render={renderWithLoadProgress(ArtistSeriesFullArtistSeriesListFragmentContainer)}
    />
  )
}