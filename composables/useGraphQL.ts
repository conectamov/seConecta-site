/**
 * useGraphQL
 * ----------
 * Thin wrapper around useAxios to send GraphQL requests.
 * Follows the exact same pattern as useAxios used throughout the project.
 *
 * Usage:
 *   const { query, mutate } = useGraphQL()
 *   const data = await query(MY_QUERY, { id: '...' })
 *   const result = await mutate(MY_MUTATION, { input: { ... } })
 */

import { useAxios } from '../composables/useAxios'

export function useGraphQL() {
  const { post } = useAxios()

  /**
   * Send a GraphQL query or mutation.
   * Returns the `data` field from the GQL response.
   * Throws if the response contains `errors`.
   */
  async function gql<T = any>(
    document: string,
    variables?: Record<string, any>,
  ): Promise<T> {
    const res = await post('/graphql', {
      query: document,
      variables: variables ?? {},
    })

    const body = res.data as { data?: T; errors?: Array<{ message: string }> }

    if (body.errors?.length) {
      // Surface first GQL error the same way REST errors surface via axios
      const msg = body.errors.map((e) => e.message).join(' | ')
      throw new Error(msg)
    }

    return body.data as T
  }

  /** Named helpers for readability */
  const query = gql
  const mutate = gql

  return { query, mutate, gql }
}
