import * as React from "react";
import Tooltip, { TooltipProps } from '@mui/material/Tooltip';
import copy from "clipboard-copy";

import { Button, CircularProgress, Dialog, DialogTitle, IconButton, InputLabel, Select, TextField } from '@mui/material';
import { darkModePrimary, darkModeSecondary, lightModePrimary, lightModeSecondary } from '../helper/Constants';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

interface ChildProps {
  copy: (content: any) => void;
}

interface Props {
  TooltipProps?: Partial<TooltipProps>;
  children: (props: ChildProps) => React.ReactElement<any>;
}

interface OwnState {
  showTooltip: boolean;
}

export class CopyToClipboard extends React.Component<Props, OwnState> {
  public state: OwnState = { showTooltip: false };

  public render() {
    return (
      <Tooltip
        open={this.state.showTooltip}
        title={"Copied to clipboard!"}
        leaveDelay={1500}
        onClose={this.handleOnTooltipClose}
        {...this.props.TooltipProps || {}}
      >
        {this.props.children({ copy: this.onCopy }) as React.ReactElement<any>}
      </Tooltip>
    );
  }

  private onCopy = (content: any) => {
    copy(content);
    this.setState({ showTooltip: true });
  };

  private handleOnTooltipClose = () => {
    this.setState({ showTooltip: false });
  };
}

export function CircularBorderDiv(props: { children: any; style: any; }) {
  const { children, style } = props;
  return (
    <div
      style={{
        border: '0.5px solid #FFFFFF',
        borderColor: darkModeSecondary,
        borderRadius: '3px',
        ...style
      }}
    >
      {children}
    </div>
  )
}

export function CustomTextField(props: { onChange: any; onBlur: any; onKeyPress: any; value: any; startAdornment: any; endAdornment: any; disabled: any; padding?: "10px" | undefined; isPassword?: false | undefined; placeholder?: "" | undefined; fullWidth?: true | undefined; style: any; maxLength?: number | undefined; multiline?: false | boolean; label?: "" | undefined; }) {
  const { onChange, onBlur, onKeyPress, value, startAdornment, endAdornment, disabled, padding = '10px', isPassword = false, placeholder = "", fullWidth = true, style, maxLength = 400, multiline = false, label = "" } = props;
  return (
    <TextField
      type={isPassword ? "password" : "text"}
      value={value}
      multiline={multiline}
      minRows={multiline ? 4 : 1}
      onChange={onChange}
      onBlur={onBlur}
      fullWidth={fullWidth}
      disabled={disabled}
      onKeyPress={onKeyPress}
      placeholder={placeholder}
      inputProps={{ maxLength: maxLength }}
      InputProps={{
        style: {
          color: darkModeSecondary,
          borderColor: darkModeSecondary,
          ...style
        },
        startAdornment: (
          startAdornment
        ),
        endAdornment: (
          endAdornment
        )
      }}
      label={label}
      size="small"
    />
  )
}

export function CustomSelect(props: { value: any; onChange: any; children: any; disabled?: false | undefined; placeholder?: "" | undefined; style: any; }) {
  const { value, onChange, children, disabled = false, placeholder = '', style } = props;
  return (
    <Select
      value={value}
      onChange={onChange}
      fullWidth
      className="selectClass"
      style={{ color: darkModeSecondary, ...style }}
      MenuProps={{
        style: {
          maxHeight: '400px'
        }
      }}
      placeholder={placeholder}
      disabled={disabled}
    >
      {children}
    </Select>
  );
}
export function CustomButton(props: { onClick: any; variant: any; children: any; width: any; height: any; fontSize: any; disabled?: false | true; loading?: false | undefined; style: any; className: any }) {
  const { onClick, variant, children, width, height, fontSize, disabled = false, loading = false, style, className } = props;
  return (
    <Button
      variant={variant}
      onClick={onClick}
      disabled={disabled}
      style={{
        color: lightModeSecondary,
        borderColor: lightModeSecondary,
        backgroundColor: lightModePrimary,
        width: width,
        height: height,
        fontSize: fontSize,
        textTransform: 'none',
        ...style
      }}
      className={className}
    >
      {children}
      {loading && <CircularProgress size={30} thickness={3} style={{ marginLeft: '20px', color: lightModeSecondary }} />}
    </Button>
  );
}

export function CustomInputLabel(props: { children: any; title: any; color?: "" | undefined; style: any; }) {
  const { children, title, color = '', style } = props;

  return (
    <InputLabel
      title={title}
      style={{
        fontSize: '12px',
        marginBottom: '5px',
        color: color != '' ? color : '#989A9B',
        ...style
      }}
    >
      {children}
    </InputLabel>
  );
}

export function CustomDialog(props: { open: any; onClose: any; children: any; maxWidth?: "md" | undefined; style: any; }) {
  const { open, onClose, children, maxWidth = "md", style } = props;
  return (
    <Dialog
      PaperProps={{
        style: {
          backgroundColor: darkModePrimary,
          ...style
        }
      }}
      fullWidth={true}
      maxWidth={maxWidth}
      open={open}
      onClose={onClose}
      transitionDuration={500}
      disableEscapeKeyDown={true}
    >
      {children}
    </Dialog>
  );
}

export function CustomDialogTitle(props: { onClick: any; children: any; }) {
  const { onClick, children } = props;
  return (
    <DialogTitle
      style={{ color: darkModeSecondary }}
    >
      {children}
      <IconButton title="Close" onClick={onClick} color="inherit" style={{ float: 'right', color: darkModeSecondary }}>
        <HighlightOffIcon />
      </IconButton>
    </DialogTitle>
  );
}