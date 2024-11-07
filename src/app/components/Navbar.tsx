class DashboardPage extends Component {
  render() {
    return (
      <BetterCircularProgress loading={this.state.loading}>
        {this.state.data ? (
          <React.Fragment>
            <div className="row">
              <div className="col-sm-12 col-md-12 col-lg-6">
                <Portlet
                  className="kt-portlet--border-bottom-brand"
                  fluidHeight={true}>
                  <PortletBody>
                    <div className="kt-widget26">
                      <div className="kt-widget26__content">
                        <span className="kt-widget26__number">
                          {this.state.data.total_usuarios}
                        </span>
                        <span className="kt-widget26__desc">Usuários</span>
                      </div>
                    </div>
                  </PortletBody>
                </Portlet>
              </div>
              <div className="col-sm-12 col-md-12 col-lg-6">
                <Portlet
                  className="kt-portlet--border-bottom-brand"
                  fluidHeight={true}>
                  <PortletBody>
                    <div className="kt-widget26">
                      <div className="kt-widget26__content">
                        <span className="kt-widget26__number">
                          {this.state.data.total_carros}
                        </span>
                        <span className="kt-widget26__desc">
                          Carros de clientes cadastrados
                        </span>
                      </div>
                    </div>
                  </PortletBody>
                </Portlet>
              </div>
              <div className="col-sm-12 col-md-12 col-lg-6">
                <Portlet
                  className="kt-portlet--border-bottom-brand"
                  fluidHeight={true}>
                  <PortletBody>
                    <div className="kt-widget26">
                      <div className="kt-widget26__content">
                        <span className="kt-widget26__number">
                          {this.state.data.total_anuncios}
                        </span>
                        <span className="kt-widget26__desc">
                          Anúncios de Carregadores cadastrados
                        </span>
                      </div>
                    </div>
                  </PortletBody>
                </Portlet>
              </div>
            </div>
          </React.Fragment>
        ) : null}
      </BetterCircularProgress>
    );
  }
}
