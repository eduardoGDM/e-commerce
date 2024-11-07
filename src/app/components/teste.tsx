import React,{Component} from "react";
import {Link} from "react-router-dom";
import BetterBox from '../../../components/BetterBox';
import BetterAlerts from '../../../components/BetterAlerts';
import BetterSelect from '../../../components/BetterSelect';
import BetterCircularProgress from '../../../components/BetterCircularProgress';
import {LayoutSubheader} from '../../../../_metronic/layout/LayoutContext';
import {autocompleteList} from '../../../crud/user.crud';
import {get,update,destroyEletropostoUser,createEletropostoUser,destroyEletropostoCarregador,createEletropostoComodidade,destroyEletropostoComodidade} from '../../../crud/eletroposto.crud';
import {Col,Row,Table} from "react-bootstrap";
import {Formik} from "formik";
import {Redirect} from "react-router-dom";
import {validateForm,indexPage,createFormData} from './EletropostoUtils';
import {TextField,Checkbox,FormControlLabel} from "@material-ui/core";
import Swal from "sweetalert2";
import moment from 'moment';
import _ from 'lodash';
import Autocomplete from '@material-ui/lab/Autocomplete';
import ModalCarregador from "./ModalCarregador";
import {
  buscaCep,formatBRLInput,formatCNPJInput,formatCPFInput,formatIntegerInput,formatTelefoneInput,getDayLabelByWeekdayNumber,
  listaUfs,formatBRL,formatIntegerInputWithZero
} from "../../../utils/Utils";
import {getComodidades} from "../../../crud/type.crud";
import QrCodePage from "../../../components/QrCodePage";
import QRCode from 'qrcode'
import ReactToPrint from 'react-to-print';

export default class EletropostoEdit extends Component {
  constructor() {
    super();

    this.state = {
      loading: false,
      submitted: false,
      success: false,
      data: null,
      errors: [],
      eletroposto_usuarios: [],
      eletroposto_comodidades: [],
      eletroposto_carregadores: [],
      eletroposto_atendimento_dias: [],
      usuario_list: [],
      usuario_selecionado: null,
      usuario_is_admin: true,
      comodidade_list: [],
      comodidade_selecionada: '',
      show_modal_carregador: false,
      carregador_update: null,
      carregador_update_idx: null,
      base64: '',
    };
  }

  componentDidMount = () => {
    this.setState({loading: true});

    getComodidades().then((res) => {
      this.setState({comodidade_list: res.data});
    });

    get(this.props.match.params.id).then((res) => {
      let eletroposto_carregadores = [];

      res.data.estacoes.forEach((car) => {
        let plugs = [];

        car.plugs.forEach(plug => {
          plugs.push({...plug,esp_preco: formatBRL(plug.esp_preco)});
        });

        eletroposto_carregadores.push({...car,plugs});
      });

      res.data.atendimento_dias.forEach(obj => {
        if(!obj.ead_almoco_hora_inicio) obj.ead_almoco_hora_inicio = '12:00';
        if(!obj.ead_almoco_hora_fim) obj.ead_almoco_hora_fim = '12:00';
      });

      this.setState({
        loading: false,
        errors: res.data.errors ? res.data.errors : [],
        data: res.data ? res.data : null,
        eletroposto_usuarios: res.data.users,
        eletroposto_comodidades: res.data.comodidades,
        eletroposto_carregadores,
        eletroposto_atendimento_dias: res.data.atendimento_dias
      });
    });
  };

  onSubmit = values => {

    if(this.state.eletroposto_usuarios.length == 0) {
      return Swal.fire('Ops','Você precisa adicionar pelo menos um usuário antes de continuar.','error');
    }

    if(this.state.eletroposto_carregadores.length == 0) {
      return Swal.fire('Ops','Você precisa adicionar pelo menos um carregador antes de continuar.','error');
    }

    let hasAdmin = false;

    this.state.eletroposto_usuarios.forEach((obj) => {
      if(obj.elu_is_admin) hasAdmin = true;
    });

    if(!hasAdmin) {
      return Swal.fire('Ops','Você precisa adicionar pelo menos um usuário admin antes de continuar.','error');
    }

    this.setState(({submitted: true}));

    let formData = createFormData({
      ...values,
      eletroposto_usuarios: this.state.eletroposto_usuarios,
      eletroposto_atendimento_dias: this.state.eletroposto_atendimento_dias,
      eletroposto_carregadores: this.state.eletroposto_carregadores,
      eletroposto_comodidades: this.state.eletroposto_comodidades
    });

    update(formData,this.props.match.params.id).then(res => {
      this.setState({success: !Boolean(res.data.errors),errors: res.data.errors ? res.data.errors : []});
    }).catch(() => {
      Swal.fire('Ops','Parece que houve um problema. Por favor, entre em contato com o suporte.','error');
    }).finally(() => {
      this.setState({submitted: false});
    });
  };

  getInitialValues = () => {
    return {
      ele_nome_fantasia: this.state.data?.ele_nome_fantasia ?? '',
      ele_privado: this.state.data?.ele_privado ? 'sim' : 'nao',
      ele_alterar_recarga_gratuita_finalizada: this.state.data?.ele_alterar_recarga_gratuita_finalizada ? 'sim' : 'nao',
      ele_razao_social: this.state.data?.ele_razao_social ?? '',
      ele_cpf: this.state.data?.ele_cpf ?? '',
      ele_cnpj: this.state.data?.ele_cnpj ?? '',
      ele_cep: this.state.data?.ele_cep ?? '',
      ele_endereco: this.state.data?.ele_endereco ?? '',
      ele_bairro: this.state.data?.ele_bairro ?? '',
      ele_cidade: this.state.data?.ele_cidade ?? '',
      ele_estado: this.state.data?.ele_estado ?? '',
      ele_numero: this.state.data?.ele_numero ?? '',
      ele_complemento: this.state.data?.ele_complemento ?? '',
      ele_telefone: this.state.data?.ele_telefone ?? '',
      ele_latitude: this.state.data?.ele_latitude ?? '',
      ele_longitude: this.state.data?.ele_longitude ?? '',
      ele_mensalidade: formatBRL(this.state.data?.ele_mensalidade) ?? '',
      ele_royalties: this.state.data?.ele_royalties ?? '',
      ele_dia_vencimento: this.state.data?.ele_dia_vencimento ?? moment().format('YYYY-MM-DD'),
      ele_observacao: this.state.data?.ele_observacao ?? '',
      ele_imagem: null,
    };
  };

  handleUserChange = (event,value) => {
    this.setState({usuario_selecionado: value});
  };

  buscarUsuarios = _.debounce((termo) => {
    if(!termo || termo == '') return;

    autocompleteList({termo}).catch(err => {
      return Swal.fire('Houve um problema ao tentar buscar os usuários. Por favor, entre em contato com o suporte.');
    }).then(res => {
      this.setState({usuario_list: res.data});
    });
  },500);

  addUsuario = () => {
    if(!this.state.usuario_selecionado) return Swal.fire('Ops','Você precisa selecionar um usuário antes de adicionar.','error');

    let added = false;

    this.state.eletroposto_usuarios.forEach((obj) => {if(obj.usuario?.id == this.state.usuario_selecionado.id) added = true;});

    if(added) return Swal.fire('Ops','Você já adicionou essa comodidade','error');

    let data = {
      elu_id_eletroposto: this.state.data.id,
      elu_id_user: this.state.usuario_selecionado.id,
      elu_is_admin: this.state.usuario_is_admin ? 1 : 0
    }

    createEletropostoUser(data).catch(err => {

    }).then(res => {
      if(res.status == 200) {
        let list = [...this.state.eletroposto_usuarios];
        list.push({user: this.state.usuario_selecionado,elu_is_admin: this.state.usuario_is_admin});
        this.setState({eletroposto_usuarios: list,usuario_selecionado: null,usuario_is_admin: true});
      }
    });
  };

  removeUsuario = (index) => {
    destroyEletropostoUser(this.state.eletroposto_usuarios[index].id).catch(err => {

    }).then(res => {
      if(res?.status == 200) {
        let list = [...this.state.eletroposto_usuarios];
        list.splice(index,1);
        this.setState({eletroposto_usuarios: list});
      }
    });
  };

  handleChangeAtendimentoDiasField = (event,index,field) => {
    let list = [...this.state.eletroposto_atendimento_dias];

    if(field == 'hora_inicio') list[index].ead_hora_inicio = event.target.value;
    if(field == 'hora_fim') list[index].ead_hora_fim = event.target.value;
    if(field == 'atende') list[index].ead_atende = !list[index].ead_atende;

    if(field == 'almoco_inicio') list[index].ead_almoco_hora_inicio = event.target.value;
    if(field == 'almoco_fim') list[index].ead_almoco_hora_fim = event.target.value;
    if(field == 'possui_almoco') list[index].ead_possui_almoco = !list[index].ead_possui_almoco;

    this.setState({eletroposto_atendimento_dias: list});
  };

  removeCarregador = (index) => {
    destroyEletropostoCarregador(this.state.eletroposto_carregadores[index].id).catch(err => {

    }).then(res => {
      if(res?.status == 200) {
        let list = [...this.state.eletroposto_carregadores];
        list.splice(index,1);
        this.setState({eletroposto_carregadores: list});
      }
    });
  };

  onSubmitModalCarregador = (data) => {
    let list = [...this.state.eletroposto_carregadores];

    if(this.state.carregador_update) {
      list[this.state.carregador_update_idx] = data;
    } else {
      list.push(data);
    }

    this.setState({show_modal_carregador: false,eletroposto_carregadores: list,carregador_update: null,carregador_update_idx: null});
  };

  onAddComodidade = () => {
    if(!this.state.comodidade_selecionada) return Swal.fire('Ops','Você precisa selecionar uma comodidade antes de adicionar.','error');

    let added = false;

    this.state.eletroposto_comodidades.forEach((obj) => {if(obj.elc_nome_comodidade == this.state.comodidade_selecionada) added = true;});

    if(added) return Swal.fire('Ops','Você já adicionou essa comodidade','error');

    let data = {
      elc_id_eletroposto: this.state.data.id,
      elc_nome_comodidade: this.state.comodidade_selecionada
    }

    createEletropostoComodidade(data).catch(err => {

    }).then(res => {
      if(res.status == 200) {
        let list = [...this.state.eletroposto_comodidades];
        // list.push({ elc_nome_comodidade: this.state.comodidade_selecionada });
        list.push(res.data);
        this.setState({eletroposto_comodidades: list,comodidade_selecionada: ''});
      }
    });
  };

  removeComodidade = (index) => {
    // let list = [...this.state.eletroposto_comodidades];
    // list.splice(index, 1);
    // this.setState({ eletroposto_comodidades: list });
    destroyEletropostoComodidade(this.state.eletroposto_comodidades[index].id).catch(err => {

    }).then(res => {
      if(res?.status == 200) {
        let list = [...this.state.eletroposto_comodidades];
        list.splice(index,1);
        this.setState({eletroposto_comodidades: list});
      }
    });
  };

  editarCarregador = (index) => {
    this.setState({carregador_update: this.state.eletroposto_carregadores[index],carregador_update_idx: index},() => {
      this.setState({show_modal_carregador: true});
    });
  };

  handlePrint = async (carregador) => {
    var opts = {
      type: 'image/jpeg',
      quality: 1
    };

    QRCode.toDataURL(carregador.est_uuid,opts)
      .then(url => {
        this.setState({base64: url});
        document.getElementById('print-button').click();
      })
      .catch(err => {
        return Swal.fire('Ops','Ocorreu um erro ao tentar gerar o Qr Code. Por favor, tente novamente','error');
      });
  };

  render() {
    return (
      <div>
        <LayoutSubheader title={`Editar eletroposto`} />

        <BetterCircularProgress loading={this.state.loading}>
          <div>
            <BetterAlerts errors={this.state.errors} />

            {this.state.success ?
              <Redirect to={{pathname: indexPage(),state: {success: ['Eletroposto editado com sucesso!']}}} />
              : null
            }

            <Formik initialValues={this.getInitialValues()} validate={values => validateForm(values)} onSubmit={(values) => this.onSubmit(values)}>
              {({values,errors,touched,handleChange,handleBlur,handleSubmit,setFieldValue}) => (
                <form noValidate={true} autoComplete="off" onSubmit={handleSubmit}>
                  <BetterBox title="Dados" subtitle="Preencha todos os campos obrigatórios.">
                    <div className="row">
                      <div className="col-sm-6">
                        <div className="form-group fg-line">
                          <TextField name="ele_nome_fantasia" label="Nome fantasia *" margin="normal" variant="outlined"
                            onBlur={handleBlur} onChange={handleChange} value={values.ele_nome_fantasia}
                            helperText={touched.ele_nome_fantasia && errors.ele_nome_fantasia}
                            error={Boolean(touched.ele_nome_fantasia && errors.ele_nome_fantasia)} />
                        </div>
                      </div>

                      <div className="col-sm-6">
                        <div className="form-group fg-line">
                          <TextField name="ele_razao_social" label="Razão social *" margin="normal" variant="outlined"
                            onBlur={handleBlur} onChange={handleChange} value={values.ele_razao_social}
                            helperText={touched.ele_razao_social && errors.ele_razao_social}
                            error={Boolean(touched.ele_razao_social && errors.ele_razao_social)} />
                        </div>
                      </div>

                      <div className="col-sm-4">
                        <div className="form-group fg-line">
                          <BetterSelect name="ele_privado" label="Privado *" labelWidth={60}
                            onBlur={handleBlur} onChange={handleChange} value={values.ele_privado}
                            helperText={touched.ele_privado && errors.ele_privado}
                            error={Boolean(touched.ele_privado && errors.ele_privado)}>
                            <option key={1} value={'sim'}>Sim</option>
                            <option key={0} value={'nao'}>Não</option>
                          </BetterSelect>
                        </div>
                      </div>

                      <div className="col-sm-4">
                        <div className="form-group fg-line">
                          <BetterSelect name="ele_alterar_recarga_gratuita_finalizada" label="Alterar recarga gratuíta finalizada? *" labelWidth={240}
                            onBlur={handleBlur} onChange={handleChange} value={values.ele_alterar_recarga_gratuita_finalizada}
                            helperText={touched.ele_alterar_recarga_gratuita_finalizada && errors.ele_alterar_recarga_gratuita_finalizada}
                            error={Boolean(touched.ele_alterar_recarga_gratuita_finalizada && errors.ele_alterar_recarga_gratuita_finalizada)}>
                            <option key={1} value={'sim'}>Sim</option>
                            <option key={0} value={'nao'}>Não</option>
                          </BetterSelect>
                        </div>
                      </div>

                      <div className="col-sm-4">
                        <div className="form-group fg-line">
                          <TextField name="ele_cpf" label="CPF " margin="normal" variant="outlined"
                            onBlur={handleBlur} onChange={e => handleChange(formatCPFInput(e))} value={values.ele_cpf}
                            helperText={touched.ele_cpf && errors.ele_cpf} inputProps={{maxLength: 14}}
                            error={Boolean(touched.ele_cpf && errors.ele_cpf)} />
                        </div>
                      </div>

                      <div className="col-sm-4">
                        <div className="form-group fg-line">
                          <TextField name="ele_cnpj" label="CNPJ " margin="normal" variant="outlined"
                            onBlur={handleBlur} onChange={e => handleChange(formatCNPJInput(e))} value={values.ele_cnpj}
                            helperText={touched.ele_cnpj && errors.ele_cnpj} inputProps={{maxLength: 18}}
                            error={Boolean(touched.ele_cnpj && errors.ele_cnpj)} />
                        </div>
                      </div>

                      <div className="col-sm-4">
                        <div className="form-group fg-line">
                          <TextField inputProps={{maxLength: 9}} name="ele_cep" label="CEP *" margin="normal" variant="outlined"
                            onBlur={handleBlur} onChange={(e) => handleChange(buscaCep(e,setFieldValue,'ele_endereco','ele_bairro','ele_cidade','ele_estado'))}
                            value={values.ele_cep} helperText={touched.ele_cep && errors.ele_cep}
                            error={Boolean(touched.ele_cep && errors.ele_cep)} />
                        </div>
                      </div>

                      <div className="col-sm-4">
                        <div className="form-group fg-line">
                          <TextField type="text" name="ele_endereco" label="Endereço *" margin="normal" variant="outlined" inputProps={{maxLength: 255}}
                            onBlur={handleBlur} onChange={handleChange} value={values.ele_endereco} helperText={touched.ele_endereco && errors.ele_endereco}
                            error={Boolean(touched.ele_endereco && errors.ele_endereco)} />
                        </div>
                      </div>

                      <div className="col-sm-4">
                        <div className="form-group fg-line">
                          <TextField type="text" name="ele_bairro" label="Bairro *" margin="normal" variant="outlined" inputProps={{maxLength: 255}}
                            onBlur={handleBlur} onChange={handleChange} value={values.ele_bairro} helperText={touched.ele_bairro && errors.ele_bairro}
                            error={Boolean(touched.ele_bairro && errors.ele_bairro)} />
                        </div>
                      </div>

                      <div className="col-sm-3">
                        <div className="form-group fg-line">
                          <TextField type="text" name="ele_cidade" label="Cidade *" margin="normal" variant="outlined" inputProps={{maxLength: 255}}
                            onBlur={handleBlur} onChange={handleChange} value={values.ele_cidade} helperText={touched.ele_cidade && errors.ele_cidade}
                            error={Boolean(touched.ele_cidade && errors.ele_cidade)} />
                        </div>
                      </div>

                      <div className="col-sm-3">
                        <div className="form-group fg-line">
                          <BetterSelect name="ele_estado" label="UF *" labelWidth={25} onBlur={handleBlur} onChange={handleChange} value={values.ele_estado}
                            helperText={touched.ele_estado && errors.ele_estado} error={Boolean(touched.ele_estado && errors.ele_estado)}>
                            {listaUfs.map((obj,i) => {
                              return <option key={i} value={obj}>{obj}</option>;
                            })}
                          </BetterSelect>
                        </div>
                      </div>

                      <div className="col-sm-3">
                        <div className="form-group fg-line">
                          <TextField type="text" name="ele_numero" label="Número *" margin="normal" variant="outlined"
                            onBlur={handleBlur} onChange={handleChange} value={values.ele_numero} helperText={touched.ele_numero && errors.ele_numero}
                            error={Boolean(touched.ele_numero && errors.ele_numero)} />
                        </div>
                      </div>

                      <div className="col-sm-3">
                        <div className="form-group fg-line">
                          <TextField type="text" name="ele_complemento" label="Complemento" margin="normal" variant="outlined"
                            onBlur={handleBlur} onChange={handleChange} value={values.ele_complemento} helperText={touched.ele_complemento && errors.ele_complemento}
                            error={Boolean(touched.ele_complemento && errors.ele_complemento)} />
                        </div>
                      </div>

                      <div className="col-sm-4">
                        <div className="form-group fg-line">
                          <TextField type="text" name="ele_telefone" label="Telefone *" margin="normal" variant="outlined" inputProps={{maxLength: 15}}
                            onBlur={handleBlur} onChange={(e) => handleChange(formatTelefoneInput(e))} value={values.ele_telefone} helperText={touched.ele_telefone && errors.ele_telefone}
                            error={Boolean(touched.ele_telefone && errors.ele_telefone)} />
                        </div>
                      </div>

                      <div className="col-sm-4">
                        <div className="form-group fg-line">
                          <TextField name="ele_latitude" label="Latitude *" margin="normal" variant="outlined"
                            onBlur={handleBlur} onChange={handleChange} value={values.ele_latitude} helperText={touched.ele_latitude && errors.ele_latitude}
                            error={Boolean(touched.ele_latitude && errors.ele_latitude)} />
                        </div>
                      </div>

                      <div className="col-sm-4">
                        <div className="form-group fg-line">
                          <TextField name="ele_longitude" label="Longitude *" margin="normal" variant="outlined"
                            onBlur={handleBlur} onChange={handleChange} value={values.ele_longitude} helperText={touched.ele_longitude && errors.ele_longitude}
                            error={Boolean(touched.ele_longitude && errors.ele_longitude)} />
                        </div>
                      </div>

                      <div className="col-sm-4">
                        <div className="form-group fg-line">
                          <TextField name="ele_mensalidade" label="Mensalidade *" margin="normal" variant="outlined"
                            onBlur={handleBlur} onChange={e => handleChange(formatBRLInput(e))} value={values.ele_mensalidade} helperText={touched.ele_mensalidade && errors.ele_mensalidade}
                            error={Boolean(touched.ele_mensalidade && errors.ele_mensalidade)} />
                        </div>
                      </div>

                      <div className="col-sm-4">
                        <div className="form-group fg-line">
                          <TextField name="ele_royalties" label="Valor dos royalties (%) *" margin="normal" variant="outlined"
                            onBlur={handleBlur} onChange={e => handleChange(formatIntegerInputWithZero(e))} value={values.ele_royalties} helperText={touched.ele_royalties && errors.ele_royalties}
                            error={Boolean(touched.ele_royalties && errors.ele_royalties)} />
                        </div>
                      </div>

                      <div className="col-sm-4">
                        <div className="form-group fg-line">
                          <TextField name="ele_dia_vencimento" label="Dia do vencimento *" margin="normal" variant="outlined" type='date'
                            onBlur={handleBlur} onChange={handleChange} value={values.ele_dia_vencimento} helperText={touched.ele_dia_vencimento && errors.ele_dia_vencimento}
                            error={Boolean(touched.ele_dia_vencimento && errors.ele_dia_vencimento)} />
                        </div>
                      </div>

                      <div className="col-sm-12">
                        <div className="form-group fg-line">
                          <TextField type="text" name="ele_observacao" label="Observação" margin="normal" variant="outlined" inputProps={{maxLength: 255}}
                            onBlur={handleBlur} onChange={handleChange} value={values.ele_observacao} helperText={touched.ele_observacao && errors.ele_observacao}
                            error={Boolean(touched.ele_observacao && errors.ele_observacao)} />
                        </div>
                      </div>
                    </div>
                  </BetterBox>

                  <BetterBox title='Imagem *' subtitle="JPG, GIF ou PNG.">
                    <Row>
                      <Col sm={6} className="mb-4">
                        <input type="file" accept="image/*" name="ele_imagem" className="d-none" id="contained-button-file" onChange={(e) =>
                          setFieldValue('ele_imagem',{url: e.currentTarget.files[0] ? URL.createObjectURL(e.currentTarget.files[0]) : null,file: e.currentTarget.files[0]})
                        } />

                        <label htmlFor="contained-button-file">
                          <span className="btn btn-success d-flex btn-bold"><i className={`margin-icon fa fa-camera`}></i>Selecione a imagem</span>
                        </label>
                      </Col>
                    </Row>

                    <Row className="justify-content-center">
                      <Col sm={4}>
                        <div className='imagemUploaderMargem'>
                          <a href={values.ele_imagem?.url ?? this.state.data?.imagem?.url} rel="noopener noreferrer" target="_blank">
                            <div className='imagemUploaderBackground' style={{backgroundImage: `url("${values.ele_imagem?.url ?? this.state.data?.imagem?.url}")`}}></div>
                          </a>

                          <button type="button" className="btn btn-danger btn-bold imagemUploaderBotaoRemover" onClick={e => setFieldValue('ele_imagem',null)}>
                            <i className="fas fa-times margin-icon" aria-hidden="true"></i>Remover
                          </button>
                        </div>
                      </Col>
                    </Row>
                  </BetterBox>

                  <BetterBox title="Usuários vinculados" >
                    <div className="row">
                      <div className="col-sm-6">
                        <div className="form-group fg-line">
                          <Autocomplete getOptionSelected={(option,value) => option.usr_nome} disableClearable noOptionsText="Sem resultados."
                            value={this.state.usuario_selecionado} clearOnBlur={true} options={this.state.usuario_list}
                            onChange={(e,v) => this.handleUserChange(e,v)} onInputChange={(e,value) => this.buscarUsuarios(value)}
                            getOptionLabel={(option) => option ? `${option.usr_nome} - ${option.email} - ${option.usr_cpf}` : ''}
                            renderInput={(params) => <TextField  {...params} label="Usuário" margin="normal" variant="outlined" />} />
                        </div>
                      </div>

                      <div className="col-sm-3">
                        <div className="form-group fg-line">
                          <BetterSelect label="Admin?" labelWidth={60} onBlur={handleBlur}
                            onChange={(e) => this.setState({usuario_is_admin: e.target.value})}
                            value={this.state.usuario_is_admin} >
                            <option key={1} value={true}>Sim</option>
                            <option key={0} value={false}>Não</option>
                          </BetterSelect>
                        </div>
                      </div>

                      <div className="col-sm-3">
                        <div className="form-group fg-line">
                          <button style={{height: '50px',marginTop: '16px'}} type="button" className="mt-8 btn-bold btn btn-success" onClick={() => this.addUsuario()}>
                            <i className={'margin-icon fa fa-plus'}></i>Adicionar usuário
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      {this.state.eletroposto_usuarios?.length > 0 ?
                        <Col sm={12}>
                          <Table striped bordered hover>
                            <thead>
                              <tr>
                                <th>Nome</th>
                                <th>Email</th>
                                <th>Admin</th>
                                <th>Opções</th>
                              </tr>
                            </thead>

                            <tbody>
                              {this.state.eletroposto_usuarios.map((obj,i) => {
                                return (
                                  <tr key={i}>
                                    <td>{obj.user.usr_nome}</td>
                                    <td>{obj.user.email}</td>
                                    <td>{obj.elu_is_admin ? 'Sim' : 'Não'}</td>
                                    <td style={{textAlign: 'center'}}>
                                      <button onClick={() => this.removeUsuario(i)} type="button" className="btn btn-danger btn-table-action"><i className="fas fa-trash-alt"></i></button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </Table>
                        </Col>
                        :
                        <Col sm={12} style={{marginTop: '15px'}}>
                          <center>
                            <h4>Não existem usuários adicionados.</h4>
                          </center>
                        </Col>
                      }
                    </div>
                  </BetterBox>

                  <BetterBox title="Atendimentos do eletroposto">
                    <div className="row">
                      {this.state.eletroposto_atendimento_dias.map((obj,i) => {
                        return (
                          <>
                            <div className="col-sm-2">
                              <div className="form-group fg-line">
                                <div style={{height: '76px',display: 'flex',alignItems: 'center'}}>
                                  <b><p style={{marginBottom: '0'}}>{getDayLabelByWeekdayNumber(obj.ead_dia)}</p></b>
                                </div>
                              </div>
                            </div>

                            <div className="col-sm-2">
                              <div className="form-group fg-line">
                                <TextField label="Hora de início *" margin="normal" variant="outlined" type='time'
                                  onChange={e => this.handleChangeAtendimentoDiasField(e,i,'hora_inicio')}
                                  value={obj.ead_hora_inicio} />
                              </div>
                            </div>

                            <div className="col-sm-2">
                              <div className="form-group fg-line">
                                <TextField label="Hora de fim *" margin="normal" variant="outlined" type='time'
                                  onChange={e => this.handleChangeAtendimentoDiasField(e,i,'hora_fim')}
                                  value={obj.ead_hora_fim} />
                              </div>
                            </div>

                            <div className="col-sm-1">
                              <div className="form-group fg-line">
                                <div style={{height: '76px',display: 'flex',alignItems: 'center'}}>
                                  <FormControlLabel label='Atende no dia?' style={{marginBottom: 0}}
                                    control={<Checkbox color="primary" checked={obj.ead_atende} value={true} />}
                                    onChange={(e) => this.handleChangeAtendimentoDiasField(e,i,'atende')} />
                                </div>
                              </div>
                            </div>

                            <div className="col-sm-2">
                              <div className="form-group fg-line">
                                <TextField label="Início do almoço *" margin="normal" variant="outlined" type='time'
                                  onChange={e => this.handleChangeAtendimentoDiasField(e,i,'almoco_inicio')}
                                  value={obj.ead_almoco_hora_inicio} InputLabelProps={{shrink: true}} />
                              </div>
                            </div>

                            <div className="col-sm-2">
                              <div className="form-group fg-line">
                                <TextField label="Fim do almoço*" margin="normal" variant="outlined" type='time'
                                  onChange={e => this.handleChangeAtendimentoDiasField(e,i,'almoco_fim')}
                                  value={obj.ead_almoco_hora_fim} InputLabelProps={{shrink: true}} />
                              </div>
                            </div>

                            <div className="col-sm-1">
                              <div className="form-group fg-line">
                                <div style={{height: '76px',display: 'flex',alignItems: 'center'}}>
                                  <FormControlLabel label='Possui almoço?' style={{marginBottom: 0}}
                                    control={<Checkbox color="primary" checked={obj.ead_possui_almoco} value={true} />}
                                    onChange={(e) => this.handleChangeAtendimentoDiasField(e,i,'possui_almoco')} />
                                </div>
                              </div>
                            </div>
                          </>
                        );
                      })}
                    </div>
                  </BetterBox>

                  <BetterBox title="Carregadores">
                    <div className="row">
                      <div className="col-sm-6">
                        <div className="form-group fg-line">
                          <button type="button" className="mt-2 btn-bold btn btn-success" onClick={() => this.setState({show_modal_carregador: true})}>
                            <i className={'margin-icon fa fa-plus'}></i>Adicionar carregador
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      {this.state.eletroposto_carregadores?.length > 0 ?
                        <Col sm={12}>
                          <Table striped bordered hover>
                            <thead>
                              <tr>
                                <th>Marca</th>
                                <th>Modelo</th>
                                {/* <th>Plugs disponíveis</th>
																<th>Potência</th>
																<th>Valor</th> */}
                                <th>Status</th>
                                <th>Opções</th>
                              </tr>
                            </thead>

                            <tbody>
                              {this.state.eletroposto_carregadores.map((obj,i) => {
                                return (
                                  <tr key={i}>
                                    <td>{obj.est_marca}</td>
                                    <td>{obj.est_modelo}</td>
                                    <td>{obj.est_ativo ? 'Ativo' : 'Inativo'}</td>
                                    <td style={{textAlign: 'center'}}>
                                      <button onClick={() => this.editarCarregador(i)} type="button" className="btn btn-primary btn-table-action"><i className="fas fa-pencil-alt"></i></button>
                                      <button onClick={() => this.removeCarregador(i)} type="button" className="btn btn-danger btn-table-action"><i className="fas fa-trash-alt"></i></button>

                                      <>
                                        <button onClick={(e) => {e.preventDefault(); this.handlePrint(obj);}} type="button" className="btn btn-primary btn-table-action"><i className="fas fa-qrcode"></i></button>
                                        <ReactToPrint content={() => this.componentRef} pageStyle={'.table-to-print {border:solid}'}
                                          documentTitle='qrcode'
                                          trigger={() => <button type="button" id="print-button" style={{display: "none"}} className="btn btn-primary btn-table-action"><i className="fas fa-print"></i></button>}>
                                        </ReactToPrint>
                                        <div style={{display: "none"}} ><QrCodePage ref={el => (this.componentRef = el)} base64={this.state.base64} /></div>
                                      </>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </Table>
                        </Col>
                        :
                        <Col sm={12} style={{marginTop: '15px'}}>
                          <center>
                            <h4>Não existem carregadores adicionados.</h4>
                          </center>
                        </Col>
                      }
                    </div>
                  </BetterBox>

                  <ModalCarregador
                    eletropostoId={this.props.match.params.id}
                    carregador={this.state.carregador_update}
                    onHide={() => this.setState({show_modal_carregador: false,carregador_update: null,carregador_update_idx: null})}
                    show_modal={this.state.show_modal_carregador}
                    onSubmit={(data) => this.onSubmitModalCarregador(data)} />

                  <BetterBox title="Comodidades" >
                    <div className="row">
                      <div className="col-sm-9">
                        <div className="form-group fg-line">
                          <BetterSelect label="Comodidade *" labelWidth={95} blankOption
                            onChange={e => this.setState({comodidade_selecionada: e.target.value})}
                            value={this.state.comodidade_selecionada} >
                            {this.state.comodidade_list.map((obj,i) => {
                              return (
                                <option key={i} value={obj}>{obj}</option>
                              )
                            })}
                          </BetterSelect>
                        </div>
                      </div>

                      <div className="col-sm-3">
                        <div className="form-group fg-line">
                          <button style={{height: '50px',marginTop: '16px'}} type="button" className="btn btn-bold btn-success" onClick={() => this.onAddComodidade()}>
                            <i className={'margin-icon fa fa-plus'}></i>Adicionar comodidade
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      {this.state.eletroposto_comodidades?.length > 0 ?
                        <Col sm={12}>
                          <Table striped bordered hover>
                            <thead>
                              <tr>
                                <th>Comodidade</th>
                                <th>Opções</th>
                              </tr>
                            </thead>

                            <tbody>
                              {this.state.eletroposto_comodidades.map((obj,i) => {
                                return (
                                  <tr key={i}>
                                    <td>{obj.elc_nome_comodidade}</td>
                                    <td style={{textAlign: 'center'}}>
                                      <button onClick={() => this.removeComodidade(i)} type="button" className="btn btn-danger btn-table-action"><i className="fas fa-trash-alt"></i></button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </Table>
                        </Col>
                        :
                        <Col sm={12} style={{marginTop: '15px'}}>
                          <center>
                            <h4>Não existem comodidades adicionados.</h4>
                          </center>
                        </Col>
                      }
                    </div>
                  </BetterBox>

                  <BetterBox>
                    <Link to={indexPage} className="btn btn-danger btn-bold"><i className="fa fa-arrow-left margin-icon"></i>Voltar</Link>

                    <button type="submit" disabled={this.state.submitted} className="btn btn-success btn-bold pull-right">
                      <i className={`margin-icon ${this.state.submitted ? "fas fa-sync fa-spin" : "fa fa-check-square"}`}></i>Enviar
                    </button>
                  </BetterBox>
                </form>
              )}
            </Formik>
          </div>
        </BetterCircularProgress>
      </div >
    );
  }
}