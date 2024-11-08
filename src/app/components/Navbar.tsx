import React,{Component} from "react";
import {Link} from "react-router-dom";
import BetterBox from '../../../components/BetterBox';
import BetterAlerts from '../../../components/BetterAlerts';
import BetterCircularProgress from '../../../components/BetterCircularProgress';
import {LayoutSubheader} from '../../../../_metronic/layout/LayoutContext';
import {getSimpleList} from '../../../crud/group.crud';
import {create} from '../../../crud/admin.crud';
import {TextField} from "@material-ui/core";
import BetterSelect from '../../../components/BetterSelect';
import {Formik} from "formik";
import {Redirect} from "react-router-dom";
import {validateForm,indexPage} from './AdminUtils';

export default class AdminNew extends Component {
constructor() {
	super();

	this.state = {
		groups: [],
		loading: false,
		submitted: false,
		success: false,
		errors: [],
	};
}

componentDidMount = () => {
	this.setState({loading: true});

	getSimpleList().then((res) => {
		this.setState({
			errors: res.data.errors ? res.data.errors : [],
			groups: res.data,
			loading: false
		});
	});
};

onSubmit = values => {
	this.setState(({submitted: true}));

	create(values).then(res => {
		this.setState({success: !Boolean(res.data.errors),errors: res.data.errors ? res.data.errors : []})
	}).catch(() => {
		alert("Parece que houve um problema. Por favor, entre em contato com o suporte.");
	}).finally(() => this.setState({...this.state,submitted: false}));
};

getInitialValues = () => {
	return {
		ad_nome: "",
		email: "",
		password: "",
		adm_id_group: ""
	};
};

render() {
	return (
		<div>
			<LayoutSubheader title={`Criar novo administrador`} />

			<BetterCircularProgress loading={this.state.loading}>
				<div>
					<BetterAlerts errors={this.state.errors} />

					{this.state.success ?
						<Redirect to={{pathname: indexPage(),state: {success: ['Administrador criado com sucesso!']}}} />
						: null
					}

<Formik initialValues={this.getInitialValues()} validate={values => validateForm(values)} onSubmit={(values) => this.onSubmit(values)}>
			{({values,errors,touched,handleChange,handleBlur,handleSubmit}) => (
				<form noValidate={true} autoComplete="off" onSubmit={handleSubmit}>
					<BetterBox title="Dados" subtitle="Preencha todos os campos obrigatórios.">
						<div className="row">
							<div className="col-sm-4">
								<div className="form-group fg-line">
									<TextField name="adm_nome" label="Nome *" margin="normal" variant="outlined"
										onBlur={handleBlur} onChange={handleChange} value={values.adm_nome} helperText={touched.adm_nome && errors.adm_nome}
										error={Boolean(touched.adm_nome && errors.adm_nome)} />
								</div>
							</div>

							<div className="col-sm-4">
								<div className="form-group fg-line">
									<TextField type="email" name="email" label="E-mail *" margin="normal" variant="outlined"
										onBlur={handleBlur} onChange={handleChange} value={values.email} helperText={touched.email && errors.email}
										error={Boolean(touched.email && errors.email)} />
								</div>
							</div>

							<div className="col-sm-4">
								<div className="form-group fg-line">
									<TextField type="password" name="password" label="Senha *" margin="normal" variant="outlined"
										onBlur={handleBlur} onChange={handleChange} value={values.password} helperText={touched.password && errors.password}
										error={Boolean(touched.password && errors.password)} />
								</div>
							</div>

							<div className="col-sm-4">
								<div className="form-group fg-line">
									<TextField type="password" name="password" label="Senha *" margin="normal" variant="outlined"
										onBlur={handleBlur} onChange={handleChange} value={values.password} helperText={touched.password && errors.password}
										error={Boolean(touched.password && errors.password)} />
								</div>
							</div>

							<div className="col-sm-4">
								<div className="form-group fg-line">
									<TextField type="password" name="password" label="Senha *" margin="normal" variant="outlined"
										onBlur={handleBlur} onChange={handleChange} value={values.password} helperText={touched.password && errors.password}
										error={Boolean(touched.password && errors.password)} />
								</div>
							</div>

							<div className="col-sm-4">
								<div className="form-group fg-line">
									<TextField type="password" name="password" label="Senha *" margin="normal" variant="outlined"
										onBlur={handleBlur} onChange={handleChange} value={values.password} helperText={touched.password && errors.password}
										error={Boolean(touched.password && errors.password)} />
								</div>
							</div>

							<div className="col-sm-4">
								<div className="form-group fg-line">
									<BetterSelect name="adm_id_group" label="Grupo *" labelWidth={55} blankOption
										onBlur={handleBlur} onChange={handleChange} value={values.adm_id_group}
										helperText={touched.adm_id_group && errors.adm_id_group}
										error={Boolean(touched.adm_id_group && errors.adm_id_group)}>
										{this.state.groups.map((obj,i) => {
											return <option key={i} value={obj.id}>{obj.gro_name}</option>
										})
										}
									</BetterSelect>
								</div>
							</div>

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
</div>
);
}
}