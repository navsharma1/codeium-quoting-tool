import jsforce from 'jsforce'

export class SalesforceClient {
  constructor(config) {
    this.config = config
    this.conn = new jsforce.Connection({
      loginUrl: `https://${config.domain}.salesforce.com`
    })
  }

  async authenticate(username, password) {
    try {
      const userInfo = await this.conn.login(username, password + this.config.securityToken)
      return userInfo
    } catch (error) {
      console.error('Salesforce authentication error:', error)
      throw error
    }
  }

  async getQuotes(userId) {
    try {
      const result = await this.conn.query(
        'SELECT Id, Name, GrandTotal, Status, CreatedDate FROM Quote WHERE OwnerId = $1',
        [userId]
      )
      return result.records
    } catch (error) {
      console.error('Error fetching quotes:', error)
      throw error
    }
  }

  async getDashboardStats(userId) {
    try {
      const [quotes, opportunities] = await Promise.all([
        this.conn.query('SELECT COUNT(Id) total, Status FROM Quote WHERE OwnerId = $1 GROUP BY Status', [userId]),
        this.conn.query('SELECT COUNT(Id) total, StageName FROM Opportunity WHERE OwnerId = $1 GROUP BY StageName', [userId])
      ])

      return {
        quotes: quotes.records,
        opportunities: opportunities.records
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      throw error
    }
  }
}
