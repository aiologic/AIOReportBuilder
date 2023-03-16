import { createElement, ReactElement, Component } from "react";
import { QueryBuilderComponent } from "@syncfusion/ej2-react-querybuilder";
import "./AIOQueryBuilder.css";

export default class QueryBuilder extends Component {
    constructor(props) {
        super(props);
        this.state = {
            reportBuilderColumns: [],
            whereClause: "",
        };
    }
    _queryBuilderRef;
    _resolveReportBuilderLoadOptions;
    _waitAnotherPropsUpdateReportBuilder;

    componentDidUpdate(prevProps) {
        if (
            prevProps.selectedColumns !== this.props.selectedColumns &&
            this.props.selectedColumns.status === "available"
        ) {
            this.getReportBuilderOptions().then(options => {
                this.setState({
                    reportBuilderColumns: options
                })
            })
        }
    }

    // https://reactjs.org/docs/react-component.html#unsafe_componentwillreceiveprops
    // will work in version 17.
    // eventually this has to be migrated to memoization helper with useMemo.
    async UNSAFE_componentWillReceiveProps(nextProps) {
        if (this._waitAnotherPropsUpdateReportBuilder) {
            this._waitAnotherPropsUpdateReportBuilder = false;
            return;
        }
        const options = this.getReportBuilderOptions(nextProps);
        this._resolveReportBuilderLoadOptions && this._resolveReportBuilderLoadOptions(await options);
        this._resolveReportBuilderLoadOptions = null;
    }

    getReportBuilderOption = (obj) => {
        const name = this.getAttributeValue(this.props.objIdName, obj);
        const type = this.getAttributeValue(this.props.objIdType, obj);
        let convertedType = type.toLowerCase();
        if(convertedType === "integer" || convertedType === "decimal" || convertedType === "autonumber" || convertedType === "long" || convertedType === "float" || convertedType === "currency") {
            convertedType = "number"
        }
        if(convertedType === "datetime") {
            convertedType = "date"
        }
        if(convertedType === "enum" || convertedType === "hash") {
            convertedType = "string"
        }
        if(convertedType === "binary") {
            convertedType = "boolean"
        }
        return { field: name, label: name, type: convertedType };
    };

    getAttributeValue = (attribute, obj) =>
        // Accessing an attribute from the list item directly is deprecated since mx9,
        // but the get() function doesn't yet exist yet in mx8. Thats why we have this check,
        // to have the widget work in both versions.
        attribute && ("get" in attribute ? attribute.get(obj).displayValue : attribute(obj).displayValue);


    handleChange = () => {
        this.setState({
            whereClause: this._queryBuilderRef.getSqlFromRules()
        })
        this.props.whereClause.setValue(this._queryBuilderRef.getSqlFromRules());
    };

    waitUntilReportBuilder = condition => {
        return new Promise(resolve => {
            const interval = setInterval(() => {
                if (!condition()) {
                    return;
                }
                clearInterval(interval);
                resolve();
            }, 100);
        });
    };

    getReportBuilderOptions = async (props = this.props) => {
        const startTime = Date.now();
        await this.waitUntilReportBuilder(() => props.selectedColumns.status !== "loading" || Date.now() > startTime + 500);
        if (!props.selectedColumns || props.selectedColumns.status !== "available") {
            return [];
        }
        return props.selectedColumns.items.map(obj => {
            return this.getReportBuilderOption(obj);
        });
    };

    render() {
        return (
            <div className="control-pane">
                <div className="control-section">
                    <div className="row">
                        <div className="col-lg-12 control-section">
                            <QueryBuilderComponent ref={(scope) => {
                                this._queryBuilderRef = scope;
                            }} ruleChange={this.handleChange} columns={this.state.reportBuilderColumns}></QueryBuilderComponent>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}